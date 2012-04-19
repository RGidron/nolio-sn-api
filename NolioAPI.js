/*
 *   NolioAPI - a class defined to provide integration services and interface between service-now and a Nolio Automation Server (www.noliosoft.com)
 *   Author: Ron Gidron
 *   Date: April 16, 2012
 */

var NolioAPI = Class.create();

NolioAPI.prototype = {

	/*
	 *   Each NolioAPI class instance works with a dedicated NAC and predefined credentials 
	 *   Instances and credentials are set in the Nolio automation application tables (included in update set ..)
	 */	
	initialize: function(url, username, password){
	
		this._url = null;
		this._nacUser = null;
		this._pwd = null;
	
		this._soapRequest = null;
		this._soapEnvelope = null;
	
	
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
	 *  Returns an array of application names 
	 */
	getAllApplications: function(){
		_soapEnvelope = getNewEnvelope();	
		_soapEnvelope.createBodyElement("mod:GetAllApplications");
		_soapEnvelope.createElement(mod:GetAllApplications, "mod:username", _nacUser);
		_soapEnvelope.createElement(mod:GetAllApplications, "mod:password", _pwd);
		var xml = executeSOAP(_soapEnvelope);
		return xml.getNodeText("//ns2:name");	
	},
	
	
	
	/*
	 *	Utility methods used by the API functions
	 */
	
	// returns a new SOAPEnvelope for fresh use 
	getNewEnvelope: function(){
		// Initialize the SOAPEnvelope and set the names spaces so we don't have to repeate this in every API call
		_soapEnvelope = new SOAPEnvelope();
   		_soapEnvelope.createNameSpace("xmlns:soap", "http://www.w3.org/2003/05/soap-envelope");
	   	_soapEnvelope.createNameSpace("xmlns:mod", "http://model.api.dataservices.server.platform.nolio.com/");	
	   	return _soapEnvelope;	
	},
	
	// executes soap requests and returns actual XML documents to the API so XPath can be used
	executeSOAP: function(envelope){
		if(typeof envelope != "undefined" && envelope != null) {
			_soapRequest.post(this._soapEnvelope);
			return new XMLDocument(_soapRequest.getResponseDoc());
		}
		gs.log("NolioAPI - ERROR: call to executeSOAP with null or undefined envelope");
		return null;
	},
	
	
	/*
	 *  setters and getters
	 */
	getNACuser: function(){
		return _nacUser;
	},
	
	getNACUrl: function() {
		return _url;
	},
	
	setNACuser: function(username){
		if(typeof url != "undefined" && url != null){
			this._url = url;
		}
	},
	
	setNACPassword: function(pwd){
		//TODO: understand how to properly use passwords here
		this._pwd = pwd;
	},
	
};