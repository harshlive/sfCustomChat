var sessKey = "";
var affinityToken = "";
var keyMap;
var evtSource;
var initFlag = false;
var isForAgent = true;
var isTransferred = false;
var base_url = "https://livechat.ngrok.io";
// var base_url = "";

var sub_types = {
  "pci": ['Book or reschedule','Change class number','Late for class','Other issue','Student has not joined','Technical issue'],
  "tci": ['Cancel slot','Class to be rescheduled','Grade mismatch','Language mismatch','Late for class','Student has not joined','Technical issue']
}

var dept_to_btnid_map = {
  "teacher_chat_ind": "5731s0000004CNH",
  "teacher_chat_int": "5731s0000004CNM",
  "1_isto_m": "5731s0000004CNR",
  "teacher_concierge": "5731s0000004CNS"
}

function getDept(itype, isubtype, dialcode, tag){
  if(itype == "pci"){
    if(tag == "paid_one_to_two"){
      return "teacher_chat_int"
    }else{
      if(dialcode == "91"){
        return "teacher_chat_ind"
      }else{
        return "teacher_chat_int"
      }
    }
  }else{
    if(isubtype == 1 || isubtype == 2 || isubtype == 5 || isubtype == 6){
      if(dialcode == "def"){
        return "teacher_chat_int"
      }else{
        return "1_isto_m"
      }
    }
    if(isubtype == 0  || isubtype == 3){
      return "teacher_concierge"
    }
    if(isubtype == 4){
      if(tag == "paid_one_to_two"){
        return "teacher_chat_int"
      }
      else{
        return "teacher_concierge"
      }
    }
  }
}

function sendMessage() {
  var msgtosend = $("#message-to-send").val();
  $("#message-to-send").val("");
  var sentmsg = `<li class="clearfix">
                                <div class="message other-message float-right">
                                    ${msgtosend}
                                </div>
                            </li>`;
  $(".chat-history ul").append(sentmsg);
  var objDiv = document.getElementById("chat-hist-container");
  objDiv.scrollTop = objDiv.scrollHeight;
  if(isForAgent){
    $.ajax({
      url:
        base_url +
        `/sendmessage?sessKey=${sessKey}&affinityToken=${affinityToken}`,
      type: "POST",
      dataType: "json",
      data: {
        message: msgtosend,
      },
      success: function (data) {},
      error: function (request, error) {
        console.log("Request: " + JSON.stringify(request));
      },
    });
  }
  else{
    $.ajax({
      url:
        base_url + `/sendbotmessage`,
      type: "POST",
      dataType: "json",
      data: {
        message: msgtosend,
      },
      success: function (data) {
        var receivedMsg = `<li>
            <div class="message my-message">
              ${data['bot-response']}
            </div>
          </li>`;
        if(data['bot-response'] == "Transfer"){
          isForAgent = !isForAgent
          isTransferred = true;
          receivedMsg = `<li>
              <div class="message my-message">
                Transferring to our agent
              </div>
            </li>`;
          startChat();
        }
        $(".chat-history ul").append(receivedMsg);
      },
      error: function (request, error) {
        console.log("Request: " + JSON.stringify(request));
      },
    });
  }

}

function sendMessageOnEnter(e) {
  if (e.keyCode == 13) {
    sendMessage();
  }
}

function getstream() {
  evtSource = new EventSource(
    base_url + `/stream?sessKey=${sessKey}&affinityToken=${affinityToken}`
  );
  evtSource.onmessage = function (e) {
    if (e.data.split("###")[1] == sessKey) {
      var receivedMsg = `<li>
                                    <div class="message my-message">
                                        ${e.data.split("###")[0]}
                                    </div>
                                </li>`;
      if (e.data.includes("Typing")) {
      } else {
        $(".chat-history ul").append(receivedMsg);
        var objDiv = document.getElementById("chat-hist-container");
        objDiv.scrollTop = objDiv.scrollHeight;
      }
    }
  };
}


// Chat Opt Functions
function showSubtype(){
  let itype = document.getElementById("issue-type").value;
  if(itype){
    $("#issue-subtype").empty();
    for(i=0; i<sub_types[itype].length;i++){
      let opt = `<option value="${i}">${sub_types[itype][i]}</option>`;
      $("#issue-subtype").append(opt);
    }
    if($("#issue-subtype-container").hasClass("is-hidden")){
      $("#issue-subtype-container").toggleClass("is-hidden");
    }
  }
}


function startChat(){
    let depid = "5721s0000008ORl";
    let orgid = "00D1s0000008lc1";

    let itype = document.getElementById("issue-type").value;
    let isubtype = document.getElementById("issue-subtype").value;
    let dialcode = document.getElementById("dialcode").innerText;
    let tag = "trial";

    let dept = getDept(itype, isubtype, dialcode, tag);
    let btnid = dept_to_btnid_map[dept]; 

    $(".chat-history ul").empty();
    if(document.getElementById("issue-subtype").selectedOptions[0].innerText == "Technical issue" && !isTransferred){
      isForAgent = !isForAgent
      var receivedMsg = `<li>
                          <div class="message my-message">
                            Hi, I am Eva a chatbot to assist you
                          </div>
                        </li>`;
      $(".chat-history ul").append(receivedMsg);
      receivedMsg = `<li>
                      <div class="message my-message">
                        Please enter you issue
                      </div>
                    </li>`;
      $(".chat-history ul").append(receivedMsg);
      var objDiv = document.getElementById("chat-hist-container");
      objDiv.scrollTop = objDiv.scrollHeight;
    }
    else{
      initFlag = !initFlag;
      initchat(btnid,depid,orgid);
    }

    // Hide Chatoptions, start btn, issue subtype dropdown
    $("#chatopt-container").toggleClass("is-hidden");
    $("#start-chat-btn").toggleClass("is-hidden");
    $("#issue-subtype-container").toggleClass("is-hidden");
    // Show ChatHistory, ChatMessage
    $("#chat-hist-container").toggleClass("is-hidden");
    $("#chat-message").toggleClass("is-hidden");
}

function closeChat(){
  if(initFlag){
    evtSource.close();
    isTransferred = false;
    // Reset Chat options container, startchatbtn
    $("#chatopt-container").toggleClass("is-hidden");
    $("#start-chat-btn").toggleClass("is-hidden");
    // Hide ChatHistory, ChatMessage
    $("#chat-hist-container").toggleClass("is-hidden");
    $("#chat-message").toggleClass("is-hidden");
  }

  $("#chat-container").toggleClass("is-hidden");
  // Show Chat Btn
  $("#initchatbtn").toggleClass("is-hidden");
  initFlag = !initFlag;
}

function initchat(btnid,depid,orgid) {
  $.ajax({
    url: base_url + `/initchat?btnid=${btnid}&depid=${depid}&orgid=${orgid}`,
    type: "GET",
    dataType: "json",
    success: function (data) {
      sessKey = data["sessKey"];
      affinityToken = data["affinityToken"];
      keyMap = data["keyMap"];
      getstream();
    },
    error: function (request, error) {
      console.log("error initiating chat");
    },
  });
}

// Utility Functions
function toggleItem(id) {
  document.getElementById(id).classList.toggle("is-hidden");
}