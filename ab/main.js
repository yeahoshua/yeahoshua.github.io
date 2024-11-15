var sel = {}
var text = {}
var toc = {}
var bybook = {}


function main() {
  makeselect()
}


// makeselect makes select fields and loads lang names
async function makeselect() {
  var booka = getparam("a")
  var bookb = getparam("b")
  if (booka == null) { booka = "yeahoshua-bible" }
  if (bookb == null) { bookb = "bible-he-yeahoshua" }
  var sel_wrap = document.getElementById("selectwrap")
  sel["a"] = elm("select", {}, sel_wrap)
  sel["b"] = elm("select", {}, sel_wrap)
  var res = await fetch("names.json")
  var langtofile = await res.json()
  fillselect(langtofile)
  sel["a"].addEventListener("change", function() {biblechange("a")}) // maybe selected("a")
  sel["b"].addEventListener("change", function() {biblechange("b")})
  sel["a"].value = booka
  sel["b"].value = bookb
  biblechange("a")
  biblechange("b")


}


// fillselect fills the select fields
function fillselect(langtofile) {
  for (var lang of keys(langtofile)) {
    console.log(lang)
    elm("option", { value: langtofile[lang] }, sel["a"], lang)
    elm("option", { value: langtofile[lang] }, sel["b"], lang)
  }
}


async function biblechange(what) {
  setparam(what, sel[what].value)
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
  var book = getparam("book")
  if (book == null) { book = "genesis" }
  renderbook(book)


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
  var toc = elm("div", { class: "toc" })
  var booktags = Object.keys(bybook)
  // console.log("updatetoc() booktags: " + booktags)
    
  for (var booktag of booktags) {
    var linktext = getprintbook(booktag, toc["a"], toc["b"])
    // var linktext = booktag
    // var link = elm("a", {}, toc, linktext) // maybe put in beautiful toc text here
    var link = document.createElement("a")
    link.textContent = linktext
    toc.appendChild(link)
    link.addEventListener("click", wrp(renderbook, booktag))
    elm("br", null, toc)
  }
  document.getElementById("tocwrap").innerHTML = ""
  document.getElementById("tocwrap").appendChild(toc)
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
  // no toc is there, just return one booktag
  if (toca == null && tocb == null) {
    out = booktag
  } else { // at least one toc is there, return both names
    out = (toca != null ? toca[booktag] : booktag) + " " + (tocb != null ? tocb[booktag] : booktag)
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
  // console.log("hello renderbook " + name)
  setparam("book", name)
  var textwrap = document.getElementById("textwrap")
  textwrap.innerHTML = bookchaptohtml(bybook[name], textwrap)
}
// bookchap to html returns html from bookchap text
// should it take lines or text?
function bookchaptohtml(lines) {
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




main()

