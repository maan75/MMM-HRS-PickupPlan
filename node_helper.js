/* Magic Mirror
 * Node Helper: MMM-HRS-PickupPlan
 *
 * By Martin Andreassen
 * ISC Licensed.
 */

const node_helper = require("node_helper");
const axios = require('axios').default;

module.exports = node_helper.create({
    start: function() {
    console.log("Starting node_helper for: " + this.name);},
    socketNotificationReceived: function (notification, payload) {
        const self = this;


	if (notification === "GET_ADRESSE_INFO") {
		console.log("Inne i GET_ADRESSE_INFO")
		axios.get("https://services.webatlas.no/GISLINE.Web.Services.Search.SOLR3.0/Service.svc/json/addressWeighted?searchString=" + payload.config.gateadresse + "&municipality=" + payload.config.kommunenr + "&weightedMunicipality=" + payload.config.kommunenr + "&firstIndex=0&maxNoOfResults=2&language=NO&coordsys=84&clientID=Android-Renovasjon-" + payload.config.kommunenr)
	 		 .then(function (response){
				let gatekode = response.data.AddressSearchResult.Roads[0].Id
				let gatenavn = response.data.AddressSearchResult.Roads[0].RoadName
				let husnr = response.data.AddressSearchResult.Roads[0].Addresses[0].House
				self.sendSocketNotification("ADRESSEINFO", {"gateKode": gatekode, "gateNavn" : gatenavn, "husnr" : husnr})						
						})
			 .catch(function (error){
						console.log(error)
						console.log("Feilet under forsøk på å hente adresseinfo")
						})
			 .then(function () {
						console.log("Completed GET_ADRESSE_INFO")
						})
		}
			
			
		if (notification === "GET_HRS_PICKUP_PLAN") {
			var tommeFrakDatoArr = []
			let AXIOSurl = "https://komteksky.norkart.no/komtek.renovasjonwebapi/api/tommekalender/?kommunenr=" + payload.config.kommunenr + "&gatenavn=" +payload.config.gateNavn+ "&gatekode=" +payload.config.gateKode+ "&husnr=" + payload.config.husnr
			
		axios({  
				method: 'get',
				url: AXIOSurl,
				headers: {	"kommunenr" : payload.config.kommunenr,
							"renovasjonappkey" : payload.config.renovasjonappkey }})
		.then(function (response){
							response.data.forEach
					(element =>{					
								element['Tommedatoer'].forEach
									(bacon =>{
										let denneTommeDatoFraObj = {};
										denneTommeDatoFraObj.fraksjonId = element.FraksjonId;
										denneTommeDatoFraObj.aktuellTommedato = bacon.split('T')[0];
										tommeFrakDatoArr.push(denneTommeDatoFraObj);
											 } //end second for each element(bacon)
									 )
								}
					) //end first for each element 
			tommeFrakDatoArr.sort((a,b)=> ((new Date(a.aktuellTommedato)) - (new Date (b.aktuellTommedato))))
			let fraksjonPrDato = {}
			tommeFrakDatoArr.forEach (
				(tommelinje) =>	{
					const dato = tommelinje.aktuellTommedato
					if (fraksjonPrDato[dato]) {
						fraksjonPrDato[dato].push(tommelinje["fraksjonId"]);}
					else { fraksjonPrDato[dato] = [tommelinje["fraksjonId"]];}})
			self.sendSocketNotification("HRS_PICKUP_PLAN", fraksjonPrDato);
			}	//end response 
			) //end then
		.catch(function (error){
						console.log(error)
						console.log("Error trying to fetch HRS_PICKUP_PLAN")
						})
		.then(function () {
						console.log("Ending GET_HRS_PICKUP_PLAN")
						})
		}
		
		if (notification === "HRS_GET_FRAK_INFO"){
			axios({
			method : 'get',
			url: 'https://komteksky.norkart.no/komtek.renovasjonwebapi/api/fraksjoner/',
			headers: {"kommunenr" : payload.config.kommunenr, "renovasjonappkey" : payload.config.renovasjonappkey}})
			.then(function (response){
				//console.log(response.data)
							self.sendSocketNotification("HRS_FRAK_INFO", response.data)
				})//end function response
			.catch(function (error){
				console.log(error);
				console.log("Error trying to fetch FRAKINFO")})
			.then(function (){
				console.log("Completed HRS_GET_FRAK_INFO") })
			}
}});
