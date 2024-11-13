function main() {
}
function biblepaste(texta, textb) {
  linesa = texta.split("\n")
  linesb = textb.split("\n")
  versetaga = []
  versetagb = []
  linea = []
  lineb = []
  booka = []
  bookb = []
  chapnuma = []
  chapnumb = []
  versenuma = []
  versenumb = []
  
  na = nb = 0
  for (var line of linesa) {
    a = line.split("\t")
    versetaga[na] = a[0]
    // get text part
    linea[na] = a[1]
    // get chapter and verse number
    b = a[0].split(/[ :]/)
    booka[na] = b[0]
    chapnuma[na] = b[1]
    versenuma[na] = b[2]
    // console.log(versetaga[na] + " " + chapnuma[na] + " " + versenuma[na])
    na++
  }
  for (var line of linesb) {
    a = line.split("\t")
    versetagb[nb] = a[0]
    // get text part
    lineb[nb] = a[1]
    // get chapter and verse number
    b = a[0].split(/[ :]/)
    bookb[nb] = b[0]
    chapnumb[nb] = b[1]
    versenumb[nb] = b[2]
    nb++
  }
//  return
  var out = ""
  var ia = ib = 0
  var iamatch = ibmatch = 0
  while (ia < linesa.length || ib < linesb.length) {
    //console.log(versetaga[ia] + " " + chapnuma[ia] + " " + versenuma[ia])
    //console.log(versetagb[ib] + " " + chapnumb[ib] + " " + versenumb[ib])
    //console.log()
    if (versetaga[ia] == versetagb[ib]) {
      iamatch = ia
      ibmatch = ib
      out += versetaga[ia] + "\t" + linea[ia] + "\t" + lineb[ib] + "\n"
      ia++
      ib++
      continue
    }
    if (versetaga[ia] == versetaga[iamatch]) {
      out += versetaga[ia] + "\t" + linea[ia] + "\t" + "\n"
      ia++
      continue
    }
    if (versetagb[ib] == versetagb[ibmatch]) {
      out += versetagb[ib] + "\t\t" + lineb[ib] + "\n"
      ib++
      continue
    }
    if (booka[ia] == booka[iamatch] && chapnuma[ia] == chapnuma[iamatch]) {
      out += versetaga[ia] + "\t" + linea[ia] + "\t" + "\n"
      ia++
      continue
    }
    if (bookb[ib] == bookb[ibmatch] && chapnumb[ib] == chapnumb[ibmatch]) {
      out += versetagb[ib] + "\t\t" + lineb[ib] + "\n"
      ib++
      continue
    }
    if (booka[ia] == booka[iamatch]) {
      out += versetaga[ia] + "\t" + linea[ia] + "\t" + "\n"
      ia++
      continue
    }
    if (bookb[ib] == bookb[ibmatch]) {
      out += versetagb[ib] + "\t\t" + lineb[ib] + "\n"
      ib++
      continue
    }


  }
  return out


}



