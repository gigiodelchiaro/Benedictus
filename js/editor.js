var _hymnGabcMap=[];
var _textGabcMap=[];

function updateEditor() {
  var gabc = $("#editor").val();
  var header = getHeader(gabc);
  var headerString = header.toString();
  var result = headerString;
  _hymnGabcMap = [];
  _textGabcMap = [];
  $("#editor").val(result + gabc.slice(header.original.length));
  layoutChant();
}

function windowResized(){
  var $cp = $("#chant-parent2");
  var $ed = $("#editor");
  var totalHeight = $(window).height() - $cp.position().top - 10 + $ed.height();
  var edHeight = Math.max(104,totalHeight*0.3);
  $cp.height(totalHeight - edHeight);
  $ed.height(edHeight);
  // exsurge.layoutChant();
}

function gabcToExsurge(gabc) {
  return gabc
    .replace(/\\Large/g, '') // Remove \\Large
    .replace(/\\color{[^}]+}/g, '') // Remove \\color{...}
    .replace(/(<b>[^<]+)<sp>'(?:oe|œ)<\/sp>/g,'$1œ</b>\u0301<b>') // character doesn't work in the bold version of this font.
    .replace(/<v>\\([VRAvra])bar<\/v>/g,'$1/.')
    .replace(/<sp>([VRAvra])\/<\/sp>\.?/g,'$1/.')
    .replace(/<b><\/b>/g,'')
    .replace(/<sp>'(?:ae|æ)<\/sp>/g,'ǽ')
    .replace(/<sp>'(?:oe|œ)<\/sp>/g,'œ́')
    .replace(/<v>\\greheightstar<\/v>/g,'*')
    .replace(/<\/?sc>/g,'%')
    .replace(/<\/?b>/g,'*')
    .replace(/<\/?i>/g,'_')
      .replace(/(\s)_([^\s*]+)_(\(\))?(\s)/g,"$1^$2^$3$4")
      .replace(/(\([cf][1-4]\)|\s)(\d+\.)(\s\S)/g,"$1^$2^$3");
}

var ctxt = makeExsurgeChantContext();
var score;

function layoutChant() {
  var gabc = $('#editor').val();
  var code = gabcToExsurge(gabc);
  var header = getHeader(gabc);
  var mappings = exsurge.Gabc.createMappingsFromSource(ctxt, code);
  score = new exsurge.ChantScore(ctxt, mappings, header['initial-style']!=='0');

  if(header['initial-style']!=='0' && header.annotation) {
    var annotationArray = header.annotationArray;
    if(annotationArray) {
      score.annotation = new exsurge.Annotations(ctxt, '%'+annotationArray[0]+'%', '%'+annotationArray[1]+'%');
    } else if(header.annotation) {
      score.annotation = new exsurge.Annotations(ctxt, '%'+header.annotation+'%');
    }
  }

  var language = header['centering-scheme'] == 'english'? exsurgeEnglish : new exsurge.Latin();
  ctxt.defaultLanguage = language;
  score.mapExsurgeToGabc = makeExsurgeToGabcMapper(code, gabc);

  var chantContainer = $('#chant-preview')[0];
  score.performLayoutAsync(ctxt, function() {
    var width = chantContainer.clientWidth;
    score.layoutChantLines(ctxt, width, function() {
      var svg = score.createSvgNode(ctxt);
      svg.removeAttribute('viewBox');
      $(chantContainer).empty().append(svg);
    });
  });
}

$(function() {
  $(window).resize(windowResized);
  $("#editor").keyup(updateEditor);

  function selectSourceIndex(index, e) {
    if(score.mapExsurgeToGabc) index = score.mapExsurgeToGabc(index);
    var textarea = $('#editor')[0];
    var length = 0;
    if(e.currentTarget.tagName == 'use') {
      length = 1;
    } else {
      try {
        length = e.currentTarget.source.text.length;
      } catch(e) { }
    }
    textarea.setSelectionRange(index + 4, index + length + 4);
    textarea.focus();
    return index;
  };

  $('#chant-preview').on('click', 'use[source-index],text[source-index]:not(.dropCap)', function(e) {
    // This is where you'd open a window for the clicked note.
    // For now, I'll just log the source index.
    var sourceIndex = selectSourceIndex(this.source.sourceIndex, e);
    var textarea = $('#editor')[0];
    var selectionStart = textarea.selectionStart;
    var selectionEnd = textarea.selectionEnd;

    var textToInsert = prompt("Insira o acorde:");
    if (textToInsert !== null) { // Check if user clicked Cancel
      var currentText = textarea.value;
      var newText = currentText.substring(0, selectionEnd) + "[alt: \\Large \\color{red} " + textToInsert + "])(" + currentText.substring(selectionEnd);
      textarea.value = newText.replace("()", '');
      updateEditor();
      // Optionally, set the cursor after the inserted text
      textarea.setSelectionRange(selectionEnd + textToInsert.length, selectionEnd + textToInsert.length);
      textarea.focus();
    }
  });

  windowResized();
  updateEditor();
});

var getGabc = function(){
  var gabc = $('#editor').val(),
      header = getHeader(gabc);
  if(!header.name) header.name = '';
  if(!header['%font']) header['%font'] = 'GaramondPremierPro';
  if(!header['%width']) header['%width'] = '7.5';
  if(!header['%fontsize']) header['%fontsize'] = '20';
  return gabc = header + gabc.slice(header.original.length);
}
