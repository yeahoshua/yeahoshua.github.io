var sel = {}
var toc = {}
var text = {}
var langcodes = {}
var ww = new wordwide()
var check = {}
  tlitcheck = {}
var bybook = {}


function main() {
  makeselect()
  initww()
  inittlit()
}


// makeselect makes select fields and loads lang names
async function makeselect() {
  var booka = getparam("a")
  var bookb = getparam("b")
  if (booka == null) { booka = "yeahoshua-bible" }
  if (bookb == null) { bookb = "bible-he-yeahoshua" }
  var wrapa = document.getElementById("select_a")
  var wrapb = document.getElementById("select_b")
  sel["a"] = elm("select", {}, wrapa)
  sel["b"] = elm("select", {}, wrapb)
  var res = await fetch("names.json")
  var langtofile = await res.json()
  for (var lang of keys(langtofile)) {
    elm("option", { value: langtofile[lang] }, sel["a"], lang)
    elm("option", { value: langtofile[lang] }, sel["b"], lang)
  }
  sel["a"].addEventListener("change", function() {biblechange("a")}) // maybe selected("a")
  sel["b"].addEventListener("change", function() {biblechange("b")})
  sel["a"].value = booka
  sel["b"].value = bookb
  biblechange("a")
  biblechange("b")


}


async function biblechange(what) {
  setparam(what, sel[what].value)
  // is there no shorter native way to get selected text of element?
  document.title = sel["a"].options[sel["a"].selectedIndex].text + " " + sel["b"].options[sel["b"].selectedIndex].text
  console.log(what)
  var res = await fetch("../txt/" + sel[what].value + ".txt")
  text[what] = await res.text()
  res = await fetch("../txt/" + sel[what].value + ".toc")
  if (res.ok) {
    var toctext = await res.text()
    toc[what] = buildtoc(toctext)
  } else { // set to null explicitly to clear old toc
    toc[what] = null
  }
  updatepaste()
  updatetoc()
  render()
  oncheck(what)


}


function updatepaste() {
  console.log("update paste")
  var pasted = biblepaste(text["a"], text["b"]).split("\n")
//  console.log("pasted: " + pasted)
//  return
  var pastelines = biblebookchap(pasted, [toc["a"], toc["b"]])
  //console.log("pastelines tail: " + pastelines.slice(pastelines.length - 10))
  bybook = getbybook(pastelines)
}


// updatetoc updates the toc content and click listeners
function updatetoc() {
  // pull the book-tags as keys from bybooks
  // maybe pull in more beautiful names from tocs
  var tocelm = elm("div", { class: "toc" })
  var booktags = Object.keys(bybook)
  // console.log("updatetoc() booktags: " + booktags)
    
  for (var booktag of booktags) {
    //console.log("booktag: " + booktag)
    //console.log("toc: " + toc)
    var linktext = getprintbook(booktag, toc["a"], toc["b"])
    //console.log("printtext: " + linktext)
    // var linktext = booktag
    // var link = elm("a", {}, toc, linktext) // maybe put in beautiful toc text here
    var link = document.createElement("a")
    link.innerHTML = linktext
    tocelm.appendChild(link)
    link.addEventListener("click", wrp(renderbook, booktag))
    elm("br", null, tocelm)
  }
  document.getElementById("tocwrap").innerHTML = ""
  document.getElementById("tocwrap").appendChild(tocelm)
}



async function initww() {
  var res = await fetch("langcodes.json")
  langcodes = await res.json()
  check["a"] = document.querySelector("#check_a")
  check["b"] = document.querySelector("#check_b")
  check["a"].addEventListener("change", function() { oncheck("a") })
  check["b"].addEventListener("change", function() { oncheck("b") })


}


// oncheck loads lingodict if needed for checkbox and kicks of render
async function oncheck(what) {
  console.log("oncheck " + what)
  var langcode = langcodes[sel[what].value]
  console.log("langcode: " + langcode)
  console.log("ww has dict he: " + ww.hasdict(langcode))
  // we need a lingodict
  if (check[what].checked && !ww.hasdict(langcode)) {
    console.log("fetching dict")
    var res = await fetch("../lingodicts/lingo-dict-" + langcode + ".json")
    var d = await res.json()
    ww.adddict(d)
  }
  render()
}



// inittlit finds tlit checkboxes and gives them event listeners
function inittlit() {
  tlitcheck["a"] = document.querySelector("#tlit_a")
  tlitcheck["b"] = document.querySelector("#tlit_b")
  tlitcheck["a"].addEventListener("change", function() { ontlit("a") })
  tlitcheck["b"].addEventListener("change", function() { ontlit("b") })
  if (getparam("tlit_a") == "true") { tlitcheck["a"].checked = true }
  if (getparam("tlit_b") == "true") { tlitcheck["b"].checked = true }


}


// ontlit triggers rendering
function ontlit(what) {
  console.log(tlitcheck[what].checked) 
  setparam("tlit_" + what, tlitcheck[what].checked) 
  render()
}




// render renders book from param
function render() {
  var book = getparam("book")
  if (book == null) { book = "genesis" }
  renderbook(book)
}
// buildtoc
function buildtoc(toctext) {
  var lines = toctext.split("\n")
  var out = {}
  for (var l of lines) {
    var f = l.split("\t")
    // map from the id-like name to the print name
    out[f[0]] = f[1]
  }
  return out
}
// getbybook returns bible lines in dict keyed by book name
function getbybook(lines) {
  var out = {}
  var thisbook = null
  for (var line of lines) {
    var a = line.split(" ")
    // new book
    if (a[0] != thisbook) {
      //console.log("a[0]: " + a[0])
      out[a[0]] = []
      thisbook = a[0]
    }
    // put in the line with versetag
    out[thisbook].push(line)
  }
  return out   
}
function setparam(what, val) {
  var url = new URL(window.location)
  url.searchParams.set(what, val)
  history.pushState(null, "", url)
}
function getparam(what) {
  var params = new URLSearchParams(document.location.search)
  return params.get(what)
}
// getprintbook returns the print names as they appear in toc or book headers
function getprintbook(booktag, toca, tocb) {
  var out = null
  //console.log("toca: " + toca + ", tocb:" + tocb)
  // no toc is there, just return one booktag
  if (toca == null && tocb == null) {
    out = booktag
  } else { // at least one toc is there, return both names
    var booka = booktag
    // carry the translit
    if (toca != null) {
      booka = (tlitcheck["a"].checked ? translit(toca[booktag]) : toca[booktag])
    }
    var bookb = booktag
    if (tocb != null) {
      bookb = (tlitcheck["b"].checked ? translit(tocb[booktag]) : tocb[booktag])
    }
    out = booka + " " + bookb
  }
  return out
}
// biblebookchap returns the text of the bible with interspersed ##book and ##chapter lines
function biblebookchap(lines, tocs) {
  var inbook = null
  var inchap = null
  var out = []
  for (var l of lines) {
    if (!l.match(/\t/)) { continue }
    var a = l.split(/[ :]/)
    if (a.length < 2) { continue }
    var thisbook = a[0]
    var thischap = a[1]
    var b = l.split(/\t/)
    var thisversetag = b[0]
    // put the versetag with in, so that these lines are 'greppable' by book
    if (thisbook != inbook) {
      out.push(thisversetag + "\t##book " + getprintbook(thisbook, tocs[0], tocs[1])) // for two tocs for now
    }
    // chap has changed or we're in a new book
    if (thischap != inchap || inbook != thisbook) {
      out.push(thisversetag + "\t##chapter " + thischap)
      inchap = thischap
    }
    // wait with the book update here in case the last book was only with one chapter
    inbook = thisbook
    out.push(l)
  }
  return out
}
// renderbook renders the clicked book in toc
function renderbook(name) {
  console.log("hello renderbook " + name)
  setparam("book", name)
  var textwrap = document.getElementById("textwrap")
  var lines = insertww(bybook[name])
  textwrap.innerHTML = tohtml(lines)
}
// insertww inserts word by word as selected on checkboxes into lines
function insertww(lines) {
  out = []
  for (var line of lines) {
    var outline = ""
    var f = line.split("\t")
    // normal line
    if (!f[1].match(/^##/)) {
      outline = f[0]
      for (var i = 1; i < f.length; i++) {
        var s = f[i]
        if (i == 1 && check["a"].checked) {
	  s = quickfixends(s)
	  outline += "\t" + ww.wwhtml(s, langcodes[sel["a"].value], "en", tlitcheck["a"].checked)
	} else if (i == 2 && check["b"].checked) {
	  s = quickfixends(s)
	  // console.log(s)
	  outline += "\t" + ww.wwhtml(s, langcodes[sel["b"].value], "en", tlitcheck["b"].checked)
	} else {
	  // console.log("tlit b: " + tlitcheck["b"].checked)
	  // translit if set
	  if (i == 1 && tlitcheck["a"].checked || i == 2 && tlitcheck["b"].checked) {
	    //console.log("translit: " + translit(s))
	    outline += "\t" + translit(s)
	    
	  } else { // else don't translit
	    outline += "\t" + s
	  }
	}
      }
    }
    // format line
    else {
      outline = line
    }
    out.push(outline)
  }
  return out
}
// tohtml returns html from bookchap text
// should it take lines or text?
function tohtml(lines) {
  var html = ""
  for (var line of lines) {
    var f = line.split("\t")
    if (f.length < 2) { continue }
    // get all but the first
    var juice = f.slice(1).join("\t")
    if (juice.match(/##book/)) {
      var book = juice.replace(/##book /, "")
      html += "<h2>" + book + "</h2>\n"
      continue
    } else if (juice.match(/##chapter/)) {
      var chap = juice.replace(/##chapter /, "")
      if (parseInt(chap) > 1) { html += "</table>" }
      html += "<h3>" + chap + "</h3>\n"
      html += "<table>"
      continue
    } else {
      // add verse number
      var b = f[0].split(":")
      html += "<sup>" + b[1] + "</sup>" // sup: superscript. without blank, but with css padding. if blank, the blank has slightly different width each line because of block text

      // make table row from fields
      var a = juice.split("\t")
      for (var s of a) {
      	  html += s + "<br/>"
      }	
    }
  }
  html += "</table>"
  return html
}

// quickfixends puts hebrew and greek wordendings back to normal
function quickfixends(s) {
  s = s.replace(/כ(\P{L})/gu, "ך$1") // actually k$1
  s = s.replace(/מ(\P{L})/gu, "ם$1")
  s = s.replace(/נ(\P{L})/gu, "ן$1")
  s = s.replace(/פ(\P{L})/gu, "ף$1")
  s = s.replace(/צ(\P{L})/gu, "ץ$1")
 
  s = s.replace(/σ(\P{L})/g, "ς$1")
  return s
}



main()

