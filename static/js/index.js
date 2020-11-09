var sessKey = "";
var affinityToken = "";
var keyMap;
var evtSource;

function sendMessage() {
  console.log($("#message-to-send").val());
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
  $.ajax({
    url: `/sendmessage?sessKey=${sessKey}&affinityToken=${affinityToken}`,
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

function sendMessageOnEnter(e) {
  if (e.keyCode == 13) {
    sendMessage();
  }
}

function toggleChat() {
  document.getElementById("chat-container").classList.toggle("chat-container");
  initchat();
}

function getstream() {
  evtSource = new EventSource(
    `/stream?sessKey=${sessKey}&affinityToken=${affinityToken}`
  );
  evtSource.onmessage = function (e) {
    // console.log(e.data.split("###")[1] == sessKey)
    // console.log(e.data);
    // console.log(sessKey);
    // console.log("-----------------------------------------------");
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

function initchat() {
  $.ajax({
    url: "/initchat",
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
