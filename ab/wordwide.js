class wordwide {

  dict = {}



  constructor(dict={}) {
    this.dict = dict
  }
  


  ww(text, lang, tolang="en", tlit=false, marksourceword=false) {
      // replace [[]] brackets (used by output) with (()) braces
      text = text.replace(/\[\[/g, "((")
      text = text.replace(/\]\]/g, "))")
  
      text = wordwide.insertbreaks(text, lang)
      var a = wordwide.split(text)
      var out = ""
      for (var w of a) {
  	// w is non-word
  	if (!w.match(/\p{L}/u)) {
  	    out += w
  	} else {
	    // w is word
	    w = w.toLowerCase()
	    var insert = ""
	    if (lang == "en" && this.dict["en"][lang]) {
		insert = this.dict["en"][lang][w]
	    }
	    else if (this.dict[lang] && this.dict[lang][w]) {
		insert = this.dict[lang][w]
	    }
	    if (tolang != null && tolang != "en") { 
		insert = this._mocktranslate(insert, tolang)
	    }
//	    out += "[[" + insert + "]] " // empty insert strings are ok, so that formatting is consistent
            if (tlit == true) {
	        w = translit(w, false)
	    }
	    if (marksourceword) {
		

	    } else {
		out += w
	    }
	    out += " [[" + insert + "]]" // empty insert strings are ok, so that formatting is consistent


  	}
      }
  

      return out
  }
  

  // wwhtml returns text as wordwide html
  wwhtml(text, langa, langb="en", tlit=false) {
    return wordwide.wwtohtml(this.ww(text, langa, langb, tlit))
  }
  

  // wwtohtml returns wordwide string as html
  static wwtohtml(s) {
      // opening brackets: &nbsp;: don't break line between word and translation
      s = s.replaceAll(/ \[\[/g, '&nbsp;<span style="font-weight:normal">')
      // opening without blank, just in case
      s = s.replaceAll(/\[\[/g, '<span style="font-weight:normal">')
      // close blacket: insert extra blank
      s = s.replaceAll(/\]\] /g, '<\/span>&nbsp; ') 
      // close bracket before comma etc: insert extra blank after comma. blank optional if no blank after last ]] in text.
      s = s.replaceAll(/\]\]([^\p{L}\p{M}])+ ?/gu, '<\/span>$1&nbsp; ')
      // close blacket without following character
      s = s.replaceAll(/\]\]/g, '<\/span>&nbsp; ') 
  
      s = '<span style="font-weight: bold">' + s + '</span>'
      return s
  }
  

  // mocktranslate translates longest word in en to other language
  _mocktranslate(en, lang) {
      var wrds = wordwide.words(en)
      wrds.sort((a, b) => { return b.length - a.length })
      smallwords = ["and", "or", "i", "you", "he", "she", "it", "we", "they", "my", "your", "his", "her", "our", "their"]
      wmax = wrds[0] // longest word
      // if the firstword is in smallwords and there is a second, take the second
      if (smallwords.includes(wmax) && wrds.length > 1) {
        wmax = wrds[1]
      }
      if (dict["en"][lang] && dict["en"][lang][wmax]) {
  	return dict["en"][lang][wmax]
      }
      // if not in dict, return english
      return en
  }
  

  // split splits text to word-strings and inter-word strings
  static split(text) {
  
      var w = "[\\p{L}\\p{M}]"
      var reg = new RegExp(
  	"(" + // open the grouping brace
  	    "[^\\p{L}\\p{M}']+" + "|" + // the standard non-letter group split exept apostrophes
  	    "(?<!" + w + ")'(?=" + w + ")" + "|" + // non-letter - apostrophe - letter
  	    "(?<=" + w + ")'(?!" + w + ")" + // letter - apostrophe - non-letter
  	")" // close the grouping brace
  	, "u") // unicode character classes used
      return text.split(reg)
  }
  

  // words returns an array of just the words of text, as delinated by our split function
  static words(text, lang) {
      text = this.insertbreaks(text, lang) // todo: pass lang
      var a = this.split(text) 
      var out = []
      for (var w of a) {
  	// w is non-word, skip
  	if (!w.match(/\p{L}/u)) {
  	    continue
  	} else { // w is word, print
  	    out.push(w)
  	}
      }
      return out
  }
  

  // insertbreaks tries to insert word breaks for chinese and japanese
  static insertbreaks(text, lang) {
      if (lang == "zh") {
  	text = zhWordBreaks(text)
      } else if (lang == "ja") {
  	text = jaWordBreaks(text)
      }
      return text
  }
  

  // hasdict returns whether a dict is there
  hasdict(langa, langb="en") {
    // can we translate to english?
    if (langb == "en") {
      return this.dict.hasOwnProperty(langa)
    } else { // can we translate to english and from english to langb?
      return this.dict.hasOwnProperty(langa) && this.dict.hasOwnProperty("en") && this.dict["en"].hasOwnProperty(langb)
    }
  }
  

  // adddict inserts new dict into this dict
  adddict(newdict) {
    this.dict = wordwide.mergedict(this.dict, newdict)
  }
  

  // mergedict inserts dfrom into dto, same words get overwritten
  static mergedict(dto, dfrom) {
      var out = Object.assign({}, dto) // make copy
      for (var lang of Object.keys(dfrom)) {
  	// create dict for lang if not there
  	if (!out[lang]) { out[lang] = {} }
  	// insert english to other lang subdicts
  	if (lang == "en") {
  	    out["en"] = wordwide.mergedict(out["en"], dfrom["en"])
  	} else { // insert word - translation pairs
  	    for (var [w, tlate] of Object.entries(dfrom[lang])) {
  		out[lang][w.toLowerCase()] = tlate.toLowerCase()
  	    }
  	}
      }
      return out
  }
  

}
//module.exports = wordwide

