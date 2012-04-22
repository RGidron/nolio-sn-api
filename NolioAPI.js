/*
 *   NolioAPI - a class defined to provide integration services and interface between service-now and a Nolio Automation Server (www.noliosoft.com)
 *   Author: Ron Gidron
 *   Created: April 16, 2012
 */

var NolioAPI = Class.create();

NolioAPI.prototype = {

	/*
	 *   Each NolioAPI class instance works with a dedicated NAC and predefined credentials 
	 *   Instances and credentials are set in the Nolio automation application tables (included in update set ..)
	 */	
	initialize: function(url, username, password){
	
		this._url = null;    	  	// the soap end point url for the Nolio automation server the current instance is attached to
		this._nacUser = null;  		// the Nolio Automation Server user name - used per each request
		this._pwd = null;   		// the Nolio Automation Server password - used per each request
		this._soapRequest = null;	// a "singleton" soap request object used by the current API instance
		this._soapEnvelope = null;	// a "singleton" soap envelope object used by the current API instance
		this.useECC = false;		// a flag to execute soap using the Service-now ECC queue or not
	
	
		if(typeof url != "undefined" && url != null){
			this._url = url;
		}else{
			gs.log("NolioAPI - ERROR: call to initialize with a null NAC url");
		}
		
		if(typeof username != "undefined" && url != null){
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
	 *  Returns a list of application names available for the current user (_nacUser) from the current server (_url)   
	 */
	getAllApplications: function(){
		_soapEnvelope = getNewEnvelope();	
		_soapEnvelope.createBodyElement("mod:GetAllApplications");
		_soapEnvelope.createElement("mod:GetAllApplications", "mod:username", _nacUser);
		_soapEnvelope.createElement("mod:GetAllApplications", "mod:password", _pwd);
		var xml = executeSOAP(_soapEnvelope);
		return xml.getNodeText("//ns2:name");	
	},
	
	/*
	 *   Returns a list of available environments for a given Nolio Application
	 */
	getEnvironmentsForApplication: function(app){
		_soapEnvelope = getNewEnvelope();	
		_soapEnvelope.createBodyElement("mod:getEnvironmentsForApplication");
		_soapEnvelope.createElement("mod:getEnvironmentsForApplication", "mod:username", _nacUser);
		_soapEnvelope.createElement("mod:getEnvironmentsForApplication", "mod:password", _pwd);
		_soapEnvelope.createElement("mod:getEnvironmentsForApplication", "mod:appName", app);
		var xml = executeSOAP(_soapEnvelope);
		return xml.getNodeText("//ns2:name");		
	},
	
	/*
	 *   Returns a list of process names assigned to an environment in a given application
	 */
	 getAssignedProcessesForEnvironment: function(app, env){
	 	_soapEnvelope = getNewEnvelope();	
		_soapEnvelope.createBodyElement("mod:getAssignedProcessesForEnvironment");
		_soapEnvelope.createElement("mod:getAssignedProcessesForEnvironment", "mod:username", _nacUser);
		_soapEnvelope.createElement("mod:getAssignedProcessesForEnvironment", "mod:password", _pwd);
		_soapEnvelope.createElement("mod:getAssignedProcessesForEnvironment", "mod:appName", app);
		_soapEnvelope.createElement("mod:getAssignedProcessesForEnvironment", "mod:envName", env);
		var xml = executeSOAP(_soapEnvelope);
		return xml.getNodeText("//ns2:processFullName");		
	 },

	/*
	 *   Returns a list of hostnames hosting Nolio agents and configured for the current Nolio server (_url)
	 */
	getAllAgents: function(){
		_soapEnvelope = getNewEnvelope();	
		_soapEnvelope.createBodyElement("mod:getAllAgents");
		_soapEnvelope.createElement("mod:getAllAgents", "mod:username", _nacUser);
		_soapEnvelope.createElement("mod:getAllAgents", "mod:password", _pwd);
		var xml = executeSOAP(_soapEnvelope);
		return xml.getNodeText("//ns2:hostName");	
	},



/*
 *==============================================================================================================================*
 *==================================	Utility methods used by the API functions	============================================*
 *==============================================================================================================================*
 */	
	// returns a new SOAPEnvelope for fresh use 
	getNewEnvelope: function(){
		// Initialize the SOAPEnvelope and set the names spaces so we don't have to repeate this in every API call
		_soapEnvelope = new SOAPEnvelope();
   		_soapEnvelope.createNameSpace("xmlns:soap", "http://www.w3.org/2003/05/soap-envelope");
	   	_soapEnvelope.createNameSpace("xmlns:mod", "http://model.api.dataservices.server.platform.nolio.com/");	
	   	return _soapEnvelope;	
	},
	
	// executes soap requests either directly or through the service-now ECC queue - returns XML to enable XPATH for the API
	executeSOAP: function(envelope){
		if(typeof envelope != "undefined" && envelope != null) {
			if(useECC==false){
				_soapRequest.post(this._soapEnvelope);
				//return new XMLDocument(_soapRequest.getResponseDoc());
			}else{
				_soapRequest.post(this._soapEnvelope, true);
				//return new XMLDocument(_soapRequest.getResponseDoc());
			}
			var status = request.getHttpStatus();
			if (status != 200) {
  				gs.log("NolioAPI - ERROR: soap error " + status);
  				return null;
			}
			return new XMLDocument(_soapRequest.getResponseDoc());
		}
		gs.log("NolioAPI - ERROR: call to executeSOAP with null or undefined envelope");
		return null;
	},
	
/*
 *==============================================================================================================================*
 *==================================	Getters & Setters   	================================================================*
 *==============================================================================================================================*
 */		
	getNACuser: function(){
		return _nacUser;
	},
	
	setNACuser: function(username){
		if(typeof _nacUser != "undefined" && _nacUser != null){
			this._nacUser = username;
		}
		return;
	},
	
	getNACUrl: function() {
		return _url;
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
		return useECC;
	},

	setUseECC: function(flag){
		if(flag!="false" && flag!="true"){
			gs.log("NolioAPI - Warninng: Trying to set useECC to a non boolean value, ignoring.");
			return;
		}
		useECC = flag;
	}
};