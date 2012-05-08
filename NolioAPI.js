/*

 *   NolioAPI - a class defined to provide integration services and interface between service-now and a Nolio Automation Server (www.noliosoft.com)
 *   Author: Ron Gidron
 *   Created: April 16, 2012
 */

NolioAPI = function(){};

NolioAPI.prototype = {

   
   /*
    *   Each NolioAPI class instance works with a dedicated NAC and predefined credentials
    *   Instances and credentials are set in the Nolio automation application tables (included in update set ..)
    */
   initialize: function(url, username, password){
      if(typeof url != "undefined" && url != null){
         this._url = url;
      }else{
         gs.log("NolioAPI - ERROR: call to initialize with a null NAC url");
      }
      
      if( (typeof(username) != "undefined") && (username != null) ){
         this._nacUser = username;
      }else{
         gs.log("NolioAPI - ERROR: call to initialize with a null username");
      }
      
      //TODO handle password accordingly
      this._pwd = password;
      
      // Initialize the SOAPRequest and set the credentials, this is only done once
      // All following API calls will manipulate SoapEnvelope alone and re use this SOAPRequest object
      this._soapRequest = new SOAPRequest(this._url, this._nacUser, this._pwd);
      
      // Initialize the SOAPEnvelope and set the names spaces so we don't have to repeat this in every API call
      this._soapEnvelope = new SOAPEnvelope();
      this._soapEnvelope.createNameSpace("xmlns:soap", "http://www.w3.org/2003/05/soap-envelope");
      this._soapEnvelope.createNameSpace("xmlns:mod", "http://model.api.dataservices.server.platform.nolio.com/");
   },
   
   /*
    *==============================================================================================================================*
    *==================================	Utility methods used by the API functions	============================================*
    *==============================================================================================================================*
    */
   // returns a new SOAPEnvelope for fresh use
   getNewEnvelope: function(){
      // Initialize the SOAPEnvelope and set the names spaces so we don't have to repeate this in every API call
      this._soapEnvelope = new SOAPEnvelope();
      this._soapEnvelope.createNameSpace("xmlns:soap", "http://www.w3.org/2003/05/soap-envelope");
      this._soapEnvelope.createNameSpace("xmlns:mod", "http://model.api.dataservices.server.platform.nolio.com/");
      return this._soapEnvelope;
   },
   
   trimNolioResponse: function(str){
   		// Get rid of the axis --uuid bullshit that is returned from Nolio's ws API			
   		return str.substring((str.indexOf("<soap:Envelope")),(str.indexOf("</soap:Envelope>")+16));
   },
   

   // executes soap requests either directly or through the service-now ECC queue - returns XML to enable XPATH for the API
   executeSOAP: function(envelope){
      var xml = "";
      if(typeof envelope != "undefined" && envelope != null) {
         if(this.useECC==false){
            this._soapRequest.post(envelope);
            xml = this.trimNolioResponse(this._soapRequest.getResponseDoc());
            gs.log("Nolio API Message: ExecuteSOAP (useECC false) returns: " + xml); 
            return xml;
         }else{
            this._soapRequest.post(envelope, true);
            xml = this.trimNolioResponse(envelope.getResponse());
            gs.log("Nolio API Message: ExecuteSOAP (useECC true) returns: " + xml);             
            return xml; 
         }
      }
      gs.log("NolioAPI - ERROR: can't do executeSOAP with null or undefined envelope");
      return null;
   },
   
   /*
    *==============================================================================================================================*
    *==================================	Getters & Setters   	================================================================*
    *==============================================================================================================================*
    */
   getNACuser: function(){
      return this._nacUser;
   },
   
   setNACuser: function(username){
      if(typeof username != "undefined" && username != null){
         this._nacUser = username;
      }
      return;
   },
   
   getNACUrl: function() {
      return this._url;
   },
   
   setNACUrl: function(url){
      if(typeof url != "undefined" && url != null){
         this._url = url;
      }
      return;
   },
   
   setNACPassword: function(pwd){
      //TODO: understand how to properly use passwords here
      this._pwd = pwd;
   },
   
   getUseECC: function(){
      return this.useECC;
   },
   
   setUseECC: function(flag){
      if(flag!="false" && flag!="true"){
         gs.log("NolioAPI - Warninng: Trying to set useECC to a non boolean value, ignoring.");
         return;
      }
      this.useECC = flag;
   },
   
   /*
    *  Returns a list of application names available for the current user (_nacUser) from the current server (_url)
    */
   getAllApplications: function(){
      var _soapEnvelope = this.getNewEnvelope();
      var mod = _soapEnvelope.createBodyElement("mod:getAllApplications");
      _soapEnvelope.createElement(mod, "mod:username", this._nacUser);
      _soapEnvelope.createElement(mod, "mod:password", this._pwd);
      var xml = this.executeSOAP(_soapEnvelope);
      var str = gs.getXMLText(xml, "/getAllApplicationsResponse/return/ApplicationWS/name");
      gs.log("Nolio API Message: getAllApplications returns:" + str); 
      return str;
   },
   
   /*
    *   Returns a list of available environments for a given Nolio Application
    */
   getEnvironmentsForApplication: function(app){
      var _soapEnvelope = getNewEnvelope();
      var mod = _soapEnvelope.createBodyElement("mod:getEnvironmentsForApplication");
      _soapEnvelope.createElement(mod, "mod:username", this._nacUser);
      _soapEnvelope.createElement(mod, "mod:password", this._pwd);
      _soapEnvelope.createElement(mod, "mod:appName", app);
      var xml = executeSOAP(_soapEnvelope);
      return xml.getNodeText("//ns2:name");
   },
   
   /*
    *   Returns a list of process names assigned to an environment in a given application
    */
   getAssignedProcessesForEnvironment: function(app, env){
      var _soapEnvelope = getNewEnvelope();
      var mod = _soapEnvelope.createBodyElement("mod:getAssignedProcessesForEnvironment");
      _soapEnvelope.createElement(mod, "mod:username", this._nacUser);
      _soapEnvelope.createElement(mod, "mod:password", this._pwd);
      _soapEnvelope.createElement(mod, "mod:appName", app);
      _soapEnvelope.createElement(mod, "mod:envName", env);
      var xml = executeSOAP(_soapEnvelope);
      return xml.getNodeText("//ns2:processFullName");
   },
   
   /*
    *   Returns a list of hostnames hosting Nolio agents and configured for the current Nolio server (_url)
    */
   getAllAgents: function(){
      var _soapEnvelope = getNewEnvelope();
      var mod = _soapEnvelope.createBodyElement("mod:getAllAgents");
      _soapEnvelope.createElement(mod, "mod:username", this._nacUser);
      _soapEnvelope.createElement(mod, "mod:password", this._pwd);
      var xml = executeSOAP(_soapEnvelope);
      return xml.getNodeText("//ns2:hostName");
   }
};

NolioAPI.prototype.useECC = false;