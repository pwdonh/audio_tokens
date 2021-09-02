/*
 * Example plugin template
 */

jsPsych.plugins["audioratings-circlesort"] = (function() {

  var plugin = {};

  plugin.info = {
    name: "audioratings-circlesort",
    parameters: {
      stimuli: {
        type: jsPsych.plugins.parameterType.OBJECT,
        default: ['file1.wav', 'file2.wav']
      }
    }
  }

  plugin.trial = function(display_element, trial) {

    var html = ''

    html += '<div class="container" style="margin-bottom:25px">'
    html += '<div class="d-flex justify-content-center">'
    html += '<div id="button-container" class="btn-group" style="margin-bottom:25px">'
    html += '</div>'
    html += '</div>'
    html += '</div>'
    html += '<div class="container" style="margin-bottom:25px">'
    html += '<div class="d-flex justify-content-center">'
    html += '<div id="plot-speakers-div">'
    html += '<svg id="plot-speakers" width="400" height="600">'
    html += '</div>'
    html += '</div>'
    html += '<div id="audio-container"></div>'

    display_element.innerHTML = html

    var num_speakers = trial.stimuli.length
    data = {'nodes': []}
    for (i=0; i<num_speakers; i++) {
      data.nodes.push({'id': 'item-'+String(i), 'audiofile': trial.stimuli[i],
                       'x': [], 'y': []})
    }

    var graph = new CircleSortGraph(data, 'plot-speakers', 'audio-container',
                                    buttonContainerId='button-container',
                                    draw_edges=true, trial_id='', width=400,
                                    nextURL=display_element, isJsPsych=true)

    graph.build()

  };

  return plugin;
})();
