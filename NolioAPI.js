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
   initialize: function(){
	  /*
	   *		Constants for XPATH  of the Nolio API
	   */
	   this.getEnvironmentsForApplicationXPATH = "/soap:Envelope/soap:Body/*[local-name()='getEnvironmentsForApplicationResponse']/*[local-name()='return']/*[local-name()='EnvironmentWS']/*[local-name()='name']";
	   this.getAssignedProcessesForEnvironmentXPATH = "/soap:Envelope/soap:Body/*[local-name()='getAssignedProcessesForEnvironmentResponse']/*[local-name()='return']/*[local-name()='ProcessWS']/*[local-name()='name']/*local-name()='processFullName'/*[local-name()='name']";
	   this.getAllAgentsXPATH = "/soap:Envelope/soap:Body/*[local-name()='getAllAgentsResponse']/*[local-name()='return']/*[local-name()='AgentWS']/*[local-name()='hostName']";
	   
	   /*
	    *	A default SOAPEnvelope with Nolio namespaces
		*/
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
   		//return str.substring((str.indexOf("<soap:Envelope")),(str.indexOf("</soap:Envelope>")+16));
      var xml_str = str.substring((str.indexOf("<soap:Envelope")),(str.indexOf("</soap:Envelope>")+16));      
      return new XMLDocument(xml_str,true);
   },
   
   printAPINodeListToGSLog: function(apicall, nodelist){
       gs.log("Nolio API Message from " + apicall + ". returning " + nodelist.getLength() + " elements. Values are: "); 
       for (i = 0; i <  nodelist.getLength(); i++){
        gs.log( apicall + "node[" + i +"] text:" + nodelist.item(i).getLastChild().getNodeValue());
       }
   },
   
   /*
    *	executes soap requests either directly or through the service-now ECC queue - returns XML to enable XPATH for the API
    */ 
   executeSOAP: function(envelope){
	   var xml = "";
	   if(typeof envelope != "undefined" && envelope != null) {
		   if(this.useECC==false){
			   gs.log("Before Post", "Nolio");
			   this._soapRequest.post(envelope);
			   gs.log("After Post", "Nolio");
			   xml = this.trimNolioResponse(this._soapRequest.getResponseDoc());
			   gs.log("Nolio API Message: ExecuteSOAP (useECC false) returns: " + xml, "Nolio"); 
			   return xml;
		   }else{
			   gs.log("Before Post", "Nolio");
			   this._soapRequest.post(envelope, true);
			   gs.log("After Post", "Nolio");
			   xml = this.trimNolioResponse(envelope.getResponse());
			   gs.log("Nolio API Message: ExecuteSOAP (useECC true) returns: " + xml);             
			   return xml; 
		   }
	   }
	   gs.log("NolioAPI - ERROR: can't do executeSOAP with null or undefined envelope");
	   return null;
   },
   
   /*
    *  Returns a list of (nolio) applications for the given nolio automation server 
    *  The Nolio automation server input is a record taken from the Nolio Automation server table in the Nolio automation server application 
    */  
   getAllApplications: function(nolioAutomationServer){
       // XPATH expression used to extract the returning values from Nolio into the array that the method returns
	   var GetAllApplicationsXPATH = "/soap:Envelope/soap:Body/*[local-name()='getAllApplicationsResponse']/*[local-name()='return']/*[local-name()='ApplicationWS']/*[local-name()='name']";
	   // Used to decrypt the password that is defined for the Nolio automation server (see Nolio Automation server table nolioAutomationServer.u_password)
	   var encrypter = new Packages.com.glide.util.Encrypter();
	   // Initialize a SOAP request object to communicate with the Nolio automation server
	   this._soapRequest = new SOAPRequest(nolioAutomationServer.u_url, nolioAutomationServer.u_username, encrypter.decrypt(nolioAutomationServer.u_password)); 
       // Decrypt the password for the communication with Nolio
	   var password = encrypter.decrypt(nolioAutomationServer.u_password);
	   // Get an empty envelope with Nolio name spaces 
	   var _soapEnvelope = this.getNewEnvelope();
	   // Set the operation we want with the current Nolio user name and password
	   var mod = _soapEnvelope.createBodyElement("mod:getAllApplications");
	   _soapEnvelope.createElement(mod, "mod:username", nolioAutomationServer.u_username);
	   _soapEnvelope.createElement(mod, "mod:password", password); 
	   // Make the SOAP call to Nolio with the envelope we prepared, save the returned xml from Nolio in a variable
	   var xml = this.executeSOAP(_soapEnvelope);
	   // add Nolio namespaces to the returned xml so we can execute XPATH on it and get an array of values
	   xml = this.addNolioNameSpaces(xml); 
	   // get the list of return values out of the xml and store in an array
	   var nodelist = xml.getNodes(GetAllApplicationsXPATH); 
	   // log the return to the glide system (look for source == "Nolio")
	   this.printAPINodeListToGSLog("getAllApplications", nodelist);
	   // return an array of application names
	   return nodelist;
   },
   
   /*
    *	executes a nolio process using soap
    */
   executeProcess: function(nolioProcess){
	   // Used to decrypt the password that is defined for the Nolio automation server (see Nolio Automation server table nolioAutomationServer.u_password)
	   var encrypter = new Packages.com.glide.util.Encrypter();
	   // The url of the referenced Nolio automation server
	   var url = nolioProcess.u_application.u_automation_server.u_url;
	   // The username of the referenced Nolio automation server
	   var username = nolioProcess.u_application.u_automation_server.u_username;
	   // The (decrypted) password for the referenced Nolio automation server user name 
	   var password = encrypter.decrypt(nolioProcess.u_application.u_automation_server.u_password);
	   var app = nolioProcess.u_application;
	   var env = nolioProcess.u_environment;




	   // Initialize a SOAP request object to communicate with the Nolio automation server
	   this._soapRequest = new SOAPRequest(url, username, password); 

	   // Get an empty envelope with Nolio name spaces 
	   var _soapEnvelope = this.getNewEnvelope();
	   var mod = _soapEnvelope.createBodyElement("mod:runProcess2");
	   _soapEnvelope.createElement(mod, "mod:username", username);
	   _soapEnvelope.createElement(mod, "mod:password", password);
	   var config = _soapEnvelope.createBodyElement("mod:config");
	   _soapEnvelope.createBodyElement("dto:agentInstances"); 
	   _soapEnvelope.createElement(config, "dto:applicationName", app); 
	   _soapEnvelope.createElement(config, "dto:dependencies"); 
	   _soapEnvelope.createElement(config, "dto:environmentName", env);	
	   var params = _soapEnvelope.createBodyElement("dto:parameters");
	   var paramAsign = _soapEnvelope.createBodyElement("dto:ParameterAssignmentWS"); 
	   _soapEnvelope.createElement(paramAsign, "dto:parameterPathName", "SN_Sys_id");
	   _soapEnvelope.createElement(paramAsign, "dto:value", "123456"); 
	   _soapEnvelope.createElement(config, "dto:processFullName", nolioProcess);
	   _soapEnvelope.createElement(mod, "mod:wait", false);
	   _soapEnvelope.createElement(mod, "mod:timeout", -1);
	   // Make the SOAP call to Nolio with the envelope we prepared, save the returned xml from Nolio in a variable
	   var xml = this.executeSOAP(_soapEnvelope);
	   // add Nolio namespaces to the returned xml so we can execute XPATH on it and get an array of values
	   xml = this.addNolioNameSpaces(xml); 
       

   	
   },
   
   addNolioNameSpaces: function(xml){
       //setting namespaces
       xml.setAttribute("xmlns:soap","http://schemas.xmlsoap.org/soap/envelope/");
       xml.setAttribute("xmlns:ns1", "http://model.api.dataservices.server.platform.nolio.com/");
       xml.setAttribute("xmlns:ns2", "http://dto.webservice.model.api.dataservices.server.platform.nolio.com");
	   return xml;
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
      this._pwd = this.encrypter.encrypt(pwd);
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
    *   Returns a list of available environments for a given Nolio Application
    */
   getEnvironmentsForApplication: function(app){
      var _soapEnvelope = this.getNewEnvelope();
      var mod = _soapEnvelope.createBodyElement("mod:getEnvironmentsForApplication");
      _soapEnvelope.createElement(mod, "mod:username", this._nacUser);
      _soapEnvelope.createElement(mod, "mod:password", this._pwd);
      _soapEnvelope.createElement(mod, "mod:appName", app);
      var xml = this.executeSOAP(_soapEnvelope);
	  xml = this.addNolioNameSpaces(xml);
      var nodelist = xml.getNodes(this.getEnvironmentsForApplicationXPATH); 
      this.printAPINodeListToGSLog("getEnvironmentsForApplication", nodelist);
      return nodelist;

   },
   
   /*
    *   Returns a list of process names assigned to an environment in a given application
    */
   getAssignedProcessesForEnvironment: function(app, env){
      var _soapEnvelope = this.getNewEnvelope();
      var mod = _soapEnvelope.createBodyElement("mod:getAssignedProcessesForEnvironment");
      _soapEnvelope.createElement(mod, "mod:username", this._nacUser);
      _soapEnvelope.createElement(mod, "mod:password", this._pwd);
      _soapEnvelope.createElement(mod, "mod:appName", app);
      _soapEnvelope.createElement(mod, "mod:envName", env);
      var xml = executeSOAP(_soapEnvelope);
	  xml = this.addNolioNameSpaces(xml);
      var nodelist = xml.getNodes(this.getAssignedProcessesForEnvironmentXPATH); 
      this.printAPINodeListToGSLog("getAssignedProcessesForEnvironment", nodelist);
      return nodelist;
	  
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
      xml = this.addNolioNameSpaces(xml);
	  var nodelist = xml.getNodes(this.getAllAgentsXPATH); 
      this.printAPINodeListToGSLog("getAllAgents", nodelist);
      return nodelist;
   }
};

NolioAPI.prototype.useECC = true;