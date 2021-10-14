/*
 * Example plugin template
 */

jsPsych.plugins["audio-tokens"] = (function() {

  var plugin = {};

  plugin.info = {
    name: "audio-tokens",
    parameters: {
      stimuli: {
        type: jsPsych.plugins.parameterType.OBJECT,
        default: ['file1.wav', 'file2.wav']
      },
      ratingtype: {
        type: jsPsych.plugins.parameterType.STRING, // BOOL, STRING, INT, FLOAT, FUNCTION, KEY, SELECT, HTML_STRING, IMAGE, AUDIO, VIDEO, OBJECT, COMPLEX
        default: 'cluster' // 'features', 'cluster' or 'similarity'
      },
      // Parameter for ratingtype 'features' and 'categories'
      label: {
        type: jsPsych.plugins.parameterType.OBJECT,
        default: ['Feature to rate']
        // for multiple features use:
        // ['1st Feature to rate', '2nd Feature to rate', '3rd Feature to rate']
      },
      // Parameter for ratingtype 'features'
      anchors: {
        type: jsPsych.plugins.parameterType.OBJECT,
        default: [['low', 'medium', 'high']]
        // for multiple features use:
        // [['low', 'medium', 'high'],
        //  ['low', 'medium', 'high'],
        //  ['low', 'medium', 'high']]
      },
      force_listen: {
        type: jsPsych.plugins.parameterType.BOOL,
        default: false
      }
    }
  }

  plugin.trial = function(display_element, trial) {

    if (trial.force_listen) {
      var opacity = .5
    } else {
      var opacity = 1.
    }
    var height = {'features': 150*trial.label.length,
                  'cluster': 400,
                  'similarity': 400,
                  'features2d': 375,
                  'categories': 225,
                  'triplets': 150}

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
    html += '<svg id="plot-speakers" width="400" height="'+height[trial.ratingtype]+'">'
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

    if (trial.ratingtype=='cluster') {
      var graph = new CircleSortGraph(data, 'plot-speakers', 'audio-container',
                                      buttonContainerId='button-container',
                                      draw_edges=true, trial_id='', width=400,
                                      nextURL=display_element, 
                                      opacity=opacity, isJsPsych=true)
    } else if (trial.ratingtype=='similarity') {
      var graph = new AudioGraph(data, 'plot-speakers', 'audio-container',
                                   buttonContainerId='button-container',
                                   draw_edges=true, trial_id='', width=400,
                                   nextURL=display_element, 
                                   opacity=opacity, isJsPsych=true)
    } else if (trial.ratingtype=='features') {
      var graph = new FeatureRatings(data, 'plot-speakers', 'audio-container',
                                     buttonContainerId='button-container',
                                     draw_edges=true,
                                     num_features=trial.label.length,
                                     feature_labels=trial.label,
                                     feature_anchors=trial.anchors,
                                     item_spacing=7.5, trial_id='', width=400,
                                     nextURL=display_element, 
                                     opacity=opacity, isJsPsych=true)
    } else if (trial.ratingtype=='features2d') {
      var graph = new FeatureRatings2D(data, 'plot-speakers', 'audio-container',
                                       buttonContainerId='button-container',
                                       draw_edges=true,
                                       feature_labels=trial.label,
                                       feature_anchors=trial.anchors,
                                       trial_id='', width=400,
                                       nextURL=display_element, 
                                       opacity=opacity, isJsPsych=true)
    } else if (trial.ratingtype=='categories') {
      var graph = new FreesortGraph(data, 'plot-speakers', 'audio-container',
                                    buttonContainerId='button-container',
                                    draw_edges=false, trial_id='', width=400,
                                    nextURL=display_element, 
                                    opacity=opacity, isJsPsych=true,
                                    num_col=trial.label.length,
                                    item_spacing=12.5,
                                    feature_labels=trial.label)
    } else if (trial.ratingtype=='triplets') {
      var graph = new TripletAudioGraph(data, 'plot-speakers', 'audio-container',
                                        buttonContainerId='button-container',
                                        draw_edges=true, trial_id='', width=400,
                                        nextURL=display_element, 
                                        opacity=opacity, isJsPsych=true)
    }

    graph.build()

  };

  return plugin;
})();
