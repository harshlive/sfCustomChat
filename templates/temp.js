
 var initESW = function (gslbBaseURL) {
    embedded_svc.settings.displayHelpButton = true;
    embedded_svc.settings.language = ""; 
    embedded_svc.settings.enabledFeatures = ["LiveAgent"];
    embedded_svc.settings.entryFeature = "LiveAgent";
    
    embedded_svc.init(
        "https://lwc710-dev-ed.my.salesforce.com",
        "https://netflix-clone-developer-edition.ap16.force.com/liveAgent",
        gslbBaseURL,
        "00D2w000000kcVU",
        "LiveAgent",
        {
            baseLiveAgentContentURL: "https://c.la2-c2-ukb.salesforceliveagent.com/content",
            deploymentId: "5722w000000UL5h",
            buttonId: "5732w000000UO2n",
            baseLiveAgentURL: "https://d.la2-c2-ukb.salesforceliveagent.com/chat",
            eswLiveAgentDevName: "EmbeddedServiceLiveAgent_Parent04I2w000000TUhOEAW_175b055d8d2",
            isOfflineSupportEnabled: false,
        }
    );
};
 
 if (!window.embedded_svc) {
    var s = document.createElement("script");
    s.setAttribute(
        "src",
        "https://lwc710-dev-ed.my.salesforce.com/embeddedservice/5.0/esw.min.js"
    );
    s.onload = function () {
        initESW(null);
    };
 document.body.appendChild(s);
 } else {
    initESW("https://service.force.com");
 }