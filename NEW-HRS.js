/* global Module */

/* Magic Mirror
 * Module: MMM-HRS-PickupPlan
 *
 * By Martin Andreassen
 * ISC Licensed.
 */

Module.register("MMM-HRS-PickupPlan", {
	defaults: {
			kommunenr: 5413,
			gateadresse: "Emma Olsens vei 1",
			antallHenteDager : 2,
			updateInterval :  60 * 60 * 1000 * 5, //5 timer,
			renovasjonappkey : "AE13DEEC-804F-4615-A74E-B4FAC11F0A30",
			retryDelay: 5000,
	},

	requiresVersion: "2.1.0", // Required version of MagicMirror

start: function(){
	this.loaded = false;
	this.loadedFrak = false;
	this.getStyles();
	var idagDato = new Date(); 
	var imorgenDato = new Date();
		imorgenDato.setDate(idagDato.getDate()+1 );	
	var monthArray = [];
	
	this.monthArray = ['', 'jan', 'feb', 'mar', 'apr', 'mai', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'des']
	this.todayDate    = idagDato.toISOString().substr(0,10);
	this.tomorrowDate = imorgenDato.toISOString().substr(0,10);
	
	this.FraksjonInfo = []; //array containing fraksjoninfo (Id, Navn og Ikon)
	this.PickupPlan = [];  
	
	this.getFrakInfo();	//Request for frakInfo
	this.getAdresseInfo(); //translate adress into structured format
	
	this.scheduleUpdate();
    },	
    
getStyles: function() {
	  return [
			this.file('MMM-HRS-PickupPlan.css'),
			]
	  },
	  
getHeader: function(){
	if (!this.config.header){
	return 'HRS-PickupPlan'}
	{return this.config.header}
	},

getFrakInfo: function(){
	  console.log("Starter getFrakInfo");
  	  this.sendSocketNotification("HRS_GET_FRAK_INFO", {
	    config: this.config }); 
	  },
	
getAdresseInfo: function(){   //translate adress into structured format
	  console.log("Starter getAdresseInfo")
	  this.sendSocketNotification("GET_ADRESSE_INFO", {
	    config: this.config }); 
	  },

getPickupPlan: function() {   //Fetch pickupPlan
	  console.log("Startet getPickupPlan")
	  this.sendSocketNotification("GET_HRS_PICKUP_PLAN", {  
            config: this.config  });   
	  },

scheduleUpdate: function(delay) {
        let nextLoad =  this.config.updateInterval; 
        if (typeof delay !== "undefined" && delay >= 0) {
            nextLoad = delay;}
        const self = this;
        setInterval(function() {
            self.getPickupPlan();
        }, nextLoad);
	},

getDom: function() {
        var wrapper = document.createElement("div");   	//Creates document 'wrapper'
      
		if (!this.loaded ||
				!this.loadedFrak) {  //   Loading... message
					let text = document.createElement("div");
					text.innerHTML = 'Henter data...';
					text.className = "dimmed light small";
			wrapper.appendChild(text);
		return wrapper;	    }
	
		if (this.loaded && this.loadedFrak) {
			if (this.config.antallHenteDager > Object.keys(this.PickupPlanArr).length) {
				this.config.antallHenteDager = Object.keys(this.PickupPlanArr).length,
				console.log("Maksimalt antall dager som kan vises er " + Object.keys(this.PickupPlanArr).length)}
	
	
var henteOversiktTable = document.createElement('table');


	  for (var henteTeller = 0; henteTeller < this.config.antallHenteDager ; henteTeller++) {   //gjør for hver hentedag
			this.henteDato = Object.keys(this.PickupPlanArr)[henteTeller];		//henter objekt key #henteteller# (som altså er dato)
			this.henteFraksjoner = this.PickupPlanArr[this.henteDato];			//plukker ut arrayet over fraksjoner som skal hentes for denne dag.
 
			var trWrapper = document.createElement("tr"); 	//Making a tableRow
		  
		  if (this.henteDato === this.todayDate){
					var tdWrapper = document.createElement("td");	//First element of row for date
					tdWrapper.innerHTML = "I dag!";
					tdWrapper.className = "tdToday";
					
				}
		  else {if (this.henteDato ===  this.tomorrowDate){
					var tdWrapper = document.createElement("td");	//First element of row for date
					tdWrapper.innerHTML = "I morgen!";
					tdWrapper.className = "tdTomorrow";

			}
		  else {	
					var tdWrapper = document.createElement("td");	//First element of row for date
					tdWrapper.className = "tdOrdi";
					var maanedTall = Number(this.henteDato.substr(5,2))
					tdWrapper.innerHTML = (this.henteDato.substr(8,2) + "." + "<br>" + this.monthArray[maanedTall]) //this.henteDato.substr(5,2));
				   }}
	
	trWrapper.appendChild(tdWrapper);		//Inserting date in first column	  
	  
	//Ikoner;
	  for (var j = 0; j < this.henteFraksjoner.length; j++) {	//For each element in henteFraksjoner
	      var tdWrapper = document.createElement("img");
	      tdWrapper.src = this.fraksjonInfo.find(x => x.Id === this.henteFraksjoner[j]).Ikon;
      trWrapper.appendChild(tdWrapper);           
	    }  ///closing foreach fraksjon
 
 
  henteOversiktTable.appendChild(trWrapper);
 
 
 
  wrapper.appendChild(henteOversiktTable)
	  
}  //lukker for hver hentedag
 
  return wrapper;}
/**/     
       
}, ///Close getDom:function

socketNotificationReceived: function(notification, payload) {
  switch (notification){

    case "HRS_FRAK_INFO":
      this.fraksjonInfo = payload;
      this.loadedFrak = true 
      console.log("FrakInfo OK")
    break
    
    case "ADRESSEINFO":
      this.config.gateNavn = payload.gateNavn
      this.config.gateKode = payload.gateKode
      this.config.husnr = payload.husnr
      console.log("Adresseinfo OK")
      
      this.getPickupPlan();  //Starting getPickupPlan
    break

    case "HRS_PICKUP_PLAN":
      this.PickupPlanArr = payload;
      this.antallHenteDatoer = Object.keys(payload).length
      this.loaded = true;
      console.log("PickupPlan OK")
      this.updateDom();
    break
	}
}
})
