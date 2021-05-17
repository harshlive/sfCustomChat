var sessKey = "";
var affinityToken = "";
var keyMap;
var evtSource;
var initFlag = false;
var isForAgent = true;
var isTransferred = false;
var base_url = "";

var sub_types = {
  "pci": ['Book or reschedule', 'Change class number', 'Late for class', 'Other issue', 'Student has not joined', 'Technical issue'],
  "tci": ['Cancel slot', 'Class to be rescheduled', 'Grade mismatch', 'Language mismatch', 'Late for class', 'Student has not joined', 'Technical issue']
}

var dept_to_btnid_map = {
  "teacher_chat_ind": "5734T000000H7W9",
  "teacher_chat_int": "5734T000000H7hR",
  "1_isto_m": "5734T000000H7hR",
  "teacher_concierge": "5734T000000H7hR"
}

function getDept(itype, isubtype, dialcode, tag) {
  if (itype == "pci") {
    if (tag == "paid_one_to_two") {
      return "teacher_chat_int"
    } else {
      if (dialcode == "91") {
        return "teacher_chat_ind"
      } else {
        return "teacher_chat_int"
      }
    }
  } else {
    if (isubtype == 1 || isubtype == 2 || isubtype == 5 || isubtype == 6) {
      if (dialcode == "def") {
        return "teacher_chat_int"
      } else {
        return "1_isto_m"
      }
    }
    if (isubtype == 0 || isubtype == 3) {
      return "teacher_concierge"
    }
    if (isubtype == 4) {
      if (tag == "paid_one_to_two") {
        return "teacher_chat_int"
      }
      else {
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
  if (isForAgent) {
    $.ajax({
      url:
        base_url +
        `/sendmessage?sessKey=${sessKey}&affinityToken=${affinityToken}`,
      type: "POST",
      dataType: "json",
      data: {
        message: msgtosend,
      },
      success: function (data) { },
      error: function (request, error) {
        console.log("Request: " + JSON.stringify(request));
      },
    });
  }
  else {
    $.ajax({
      url:
        base_url + `/sendbotmessage`,
      type: "POST",
      dataType: "json",
      data: {
        message: msgtosend,
      },
      success: function (data) {
        var objDiv = document.getElementById("chat-hist-container");
        var receivedMsg = `<li>
            <div class="message my-message">
              <i class="fas fa-robot"></i>
              ${data['bot-response']}
            </div>
          </li>`;
        if (data['bot-response'] == "Transfer") {
          isForAgent = true;
          isTransferred = true;
          receivedMsg = `<li>
              <div class="message my-message">
                <i class="fas fa-robot"></i>
                Transferring to an agent
              </div>
            </li>`;
          startChat();
        }
        $(".chat-history ul").append(receivedMsg);
        objDiv.scrollTop = objDiv.scrollHeight;

        setTimeout(function () {
          receivedMsg = `<li>
            <div class="message my-message">
              Issue not resolved?<br>
              Would you like me to connect you to an agent?
            </div>
            <div id="transfer-btn">
              <button class="btn" onclick="transferChat()">
                Yes
              </button>
              <button class="btn" onclick="showCloseMsg()">
                No
              </button>
            </div>
          </li>`;
          $(".chat-history ul").append(receivedMsg);
          objDiv.scrollTop = objDiv.scrollHeight;
        }, 1000);
      },
      error: function (request, error) {
        console.log("Request: " + JSON.stringify(request));
      },
    });
  }

}

function transferChat() {
  $("#transfer-btn").addClass("is-hidden");
  var msg = `<li>
    <div class="message my-message">
      Connecting...
    </div>
  </li>`;
  $(".chat-history ul").append(msg);
  isForAgent = true;
  isTransferred = true;
  var objDiv = document.getElementById("chat-hist-container");
  objDiv.scrollTop = objDiv.scrollHeight;
  startChat();
}

function showCloseMsg() {
  $("#transfer-btn").addClass("is-hidden");
  var msg = `<li>
    <div class="message my-message">
      Click on "X" to close chat.
    </div>
  </li>`;
  $(".chat-history ul").append(msg);
  var objDiv = document.getElementById("chat-hist-container");
  objDiv.scrollTop = objDiv.scrollHeight;
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
function showSubtype() {
  let itype = document.getElementById("issue-type").value;
  if (itype) {
    $("#issue-subtype").empty();
    for (i = 0; i < sub_types[itype].length; i++) {
      let opt = `<option value="${i}">${sub_types[itype][i]}</option>`;
      $("#issue-subtype").append(opt);
    }
    $("#issue-subtype-container").removeClass("is-hidden");
  }
}


function startChat() {
  let depid = "5724T000000H6bt";
  let orgid = "00D4T000000GCgk";

  let itype = document.getElementById("issue-type").value;
  let isubtype = document.getElementById("issue-subtype").value;
  let dialcode = document.getElementById("dialcode").innerText;
  let tag = "trial";

  let dept = getDept(itype, isubtype, dialcode, tag);
  let btnid = dept_to_btnid_map[dept];

  if (document.getElementById("issue-subtype").selectedOptions[0].innerText == "Technical issue" && !isTransferred) {
    isForAgent = false;
    var receivedMsg = `<li>
                          <div class="message my-message">
                            Connecting ...
                          </div>
                        </li>`;
    $(".chat-history ul").append(receivedMsg);

    // Hide Chatoptions, start btn, issue subtype dropdown
    $("#chatopt-container").addClass("is-hidden");
    $("#start-chat-btn").addClass("is-hidden");
    $("#issue-subtype-container").addClass("is-hidden");
    // Show ChatHistory, ChatMessage
    $("#chat-hist-container").removeClass("is-hidden");
    $("#chat-message").removeClass("is-hidden");

    setTimeout(function () {
      var receivedMsg = `<li>
        <div class="message my-message">
          <i class="fas fa-robot"></i>
          Hi, I am Eva a chatbot to assist you
        </div>
        </li>`;
      $(".chat-history ul").append(receivedMsg);
      receivedMsg = `<li>
            <div class="message my-message">
              <i class="fas fa-robot"></i>
              Please enter you issue
            </div>
          </li>`;
      $(".chat-history ul").append(receivedMsg);
      var objDiv = document.getElementById("chat-hist-container");
      objDiv.scrollTop = objDiv.scrollHeight;
    }, 1000);

  }
  else {
    var receivedMsg = `<li>
                          <div class="message my-message">
                            Connecting ...
                          </div>
                        </li>`;
    $(".chat-history ul").append(receivedMsg);

    initFlag = true;
    initchat(btnid, depid, orgid);

    if (!isTransferred) {
      // Hide Chatoptions, start btn, issue subtype dropdown
      $("#chatopt-container").addClass("is-hidden");
      $("#start-chat-btn").addClass("is-hidden");
      $("#issue-subtype-container").addClass("is-hidden");
      // Show ChatHistory, ChatMessage
      $("#chat-hist-container").removeClass("is-hidden");
      $("#chat-message").removeClass("is-hidden");
    }
  }
}

function closeChat() {
  if (initFlag) {
    evtSource.close();
    isTransferred = false;
    // Reset Chat options container, startchatbtn
    $("#chatopt-container").removeClass("is-hidden");
    $("#start-chat-btn").removeClass("is-hidden");
    // Hide ChatHistory, ChatMessage
    $("#chat-hist-container").addClass("is-hidden");
    $("#chat-message").addClass("is-hidden");
  }

  $("#chat-container").addClass("is-hidden");
  // Show Chat Btn
  $("#initchatbtn").removeClass("is-hidden");

  $(".chat-history ul").empty();
  initFlag = false;
}

function initchat(btnid, depid, orgid) {
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