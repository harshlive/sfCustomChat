# FLASK CHAT APP SALESFORCE LIVEAGENT API
import requests
from flask import Flask, request, render_template, Response
import time
import json
from uuid import uuid4
import redis
from flask_cors import CORS
import python_jwt as jwt
import jwcrypto.jwk as jwk

app = Flask(__name__)
CORS(app)


@app.route("/")
def home():
    sid = request.args.get("sid")
    if(sid == '1'):
        context = {"Name": "Student 1",
                   "Phone": "+91 7245681126", "DC": "91"}
    else:
        context = {"Name": "Student 2", "Phone": "+1 1345681126", "DC": "1"}

    return render_template('index.html', context=context)


@app.route('/initchat')
def initchat():
    btnid = request.args.get('btnid')
    orgid = request.args.get('orgid')
    depid = request.args.get('depid')
    sessMapper = str(uuid4())
    session_id, affinity_token, key = getSessionId()
    getChasitorInit(session_id, affinity_token, key, orgid, depid, btnid)
    r = redis.Redis('localhost')
    r.set(sessMapper, key)
    r.expire(sessMapper, 3800)
    return json.dumps({'sessKey': sessMapper, 'affinityToken': affinity_token}), 200, {'ContentType': 'application/json'}


@app.route('/stream')
def stream():
    key = request.args['sessKey']
    r = redis.Redis('localhost')
    sessKey = r.get(key)
    affToken = request.args['affinityToken']

    def eventStream():
        try:
            while True:
                yield f"data: {getMessages(1, affToken, sessKey)}###{key}\n\n"
                time.sleep(0.5)
        except:
            print("Connection Closed")
    resp = Response(eventStream(), mimetype="text/event-stream")
    resp.headers.add('Access-Control-Allow-Origin', '*')
    # return Response(eventStream(), mimetype="text/event-stream")
    return resp


@app.route("/sendmessage", methods=['POST'])
def sendMessage():
    key = request.args['sessKey']
    r = redis.Redis('localhost')
    sessKey = r.get(key)
    affToken = request.args['affinityToken']
    msg = request.form['message']
    sendChatMessage(1, affToken, sessKey, msg)
    return json.dumps({'success': True}), 200, {'ContentType': 'application/json'}


@app.route("/sendbotmessage", methods=['POST'])
def sendBotMessage():
    msg = request.form['message']
    token = getEinsteinToken()
    intent = getIntent(token, msg)
    bot_resp = "Please try the following troubleshooting steps:<br>"
    if intent == "Unable to start class":
        bot_resp += "Please refresh the page after clearing cache and try again"
    elif intent == "Cannot View Student":
        bot_resp = 'I found this article which might help you<br><a href="https://www.dropbox.com/s/iorwl7pl4oxmla4/wjh_video_ts.pdf?dl=0" target="_blank">Video Troubleshoot guide</a>'
    elif intent == "Cannot Hear Student":
        bot_resp += "1. Check if the audio driver is updated.<br>2. Use the Troubleshooting tool.<br>3. Set default speakers and test the sound."
    elif intent == "Transfer to agent":
        bot_resp = "Transfer"
    return json.dumps({'success': True, 'bot-response': bot_resp}), 200, {'ContentType': 'application/json'}


def getSessionId():
    url = "https://d.la2-c1cs-hnd.salesforceliveagent.com/chat/rest/System/SessionId"

    payload = {}
    headers = {
        'X-LIVEAGENT-AFFINITY': 'null',
        'X-LIVEAGENT-API-VERSION': '50',
    }

    response = requests.request("GET", url, headers=headers, data=payload)
    response_dict = response.json()
    session_id = response_dict['id']
    affinity_token = response_dict['affinityToken']
    key = response_dict['key']
    return session_id, affinity_token, key


def getChasitorInit(session_id, affinity_token, key, orgid, depid, btnid):
    url = "https://d.la2-c1cs-hnd.salesforceliveagent.com/chat/rest/Chasitor/ChasitorInit"

    # payload = {
    #     "sessionId": session_id,
    #     "organizationId": "00D2w000000kcVU",
    #     "deploymentId": "5722w000000UL5h",
    #     "buttonId": "5732w000000UO2n",
    #     "userAgent": "",
    #     "language": "en-US",
    #     "screenResolution": "1900x1080",
    #     "visitorName": "Test Visitor",
    #     "prechatDetails": [],
    #     "prechatEntities": [],
    #     "receiveQueueUpdates": True,
    #     "isPost": True
    # }

    payload = {
        "sessionId": session_id,
        "organizationId": orgid,
        "deploymentId": depid,
        "buttonId": btnid,
        "userAgent": "",
        "language": "en-US",
        "screenResolution": "1900x1080",
        "visitorName": "Test Visitor",
        "prechatDetails": [],
        "prechatEntities": [],
        "receiveQueueUpdates": True,
        "isPost": True
    }

    headers = {
        'X-LIVEAGENT-AFFINITY': affinity_token,
        'X-LIVEAGENT-API-VERSION': '50',
        'X-LIVEAGENT-SESSION-KEY': key,
    }

    requests.request("POST", url, headers=headers, data=json.dumps(payload))


def getMessages(session_id, affinity_token, key):
    url = "https://d.la2-c1cs-hnd.salesforceliveagent.com/chat/rest/System/Messages"
    payload = {}
    headers = {
        'X-LIVEAGENT-AFFINITY': affinity_token,
        'X-LIVEAGENT-API-VERSION': '50',
        'X-LIVEAGENT-SESSION-KEY': key,

    }
    response = requests.request("GET", url, headers=headers, data=payload)

    json_resp = {}
    message = ""
    if response.status_code == 200:
        json_resp = response.json()
        if json_resp['messages'][0]['type'] == "ChatMessage":
            for i in range(0, len(json_resp['messages'])):
                print("Message array", json_resp['messages'][i]['message'])
                if 'text' in json_resp['messages'][i]['message'].keys():
                    message += json_resp['messages'][i]['message']['text']
        elif json_resp['messages'][0]['type'] == "ChatRequestSuccess":
            message = "Connected to Agent"
        else:
            message = "Typing"
    else:
        print(response.status_code)
        message = "Typing"

    print("Message: ", message)
    return message


def sendChatMessage(session_id, affinity_token, key, message):
    url = "https://d.la2-c1cs-hnd.salesforceliveagent.com/chat/rest/Chasitor/ChatMessage"
    payload = '{"text": "' + message + '"}'

    headers = {
        'X-LIVEAGENT-AFFINITY': affinity_token,
        'X-LIVEAGENT-API-VERSION': '50',
        'X-LIVEAGENT-SESSION-KEY': key,

    }

    response = requests.request("POST", url, headers=headers, data=payload)
    return response.status_code


def getEinsteinToken():
    url = "https://api.einstein.ai/v2/oauth2/token"

    with open('einstein_platform.pem', 'rb') as pemfile:
        key = pemfile.read()

    key = jwk.JWK.from_pem(data=key)

    payload = {'sub': 'subhash.rajpurohit@aethereus.com',
               'aud': "https://api.einstein.ai/v2/oauth2/token", 'exp': int(time.time()+600)}
    jwttoken = jwt.generate_jwt(payload, key, 'RS256')

    payload = 'grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=' + \
        str(jwttoken)

    headers = {
        'Content-type': 'application/x-www-form-urlencoded'
    }

    response = requests.request("POST", url, headers=headers, data=payload)

    return response.json()['access_token']


def getIntent(token, message):
    url = "https://api.einstein.ai/v2/language/intent"

    payload = {'modelId': 'G2CYANDOZNHHSNRWVHLA3EZAN4',
               'document': message}

    headers = {
        'Authorization': f'Bearer {token}',
        'Cache-Control': 'no-cache',
        'Content-Type': 'application/json'
    }

    response = requests.post(url, headers=headers, json=payload)
    maxProbabilityItem = max(
        response.json()['probabilities'], key=lambda x: x['probability'])

    return maxProbabilityItem['label']


if __name__ == "__main__":
    app.run()

# Endpoint https://d.la2-c2-ukb.salesforceliveagent.com/chat/rest/
# New EP   https://d.la2-c1cs-hnd.salesforceliveagent.com/chat/rest/
