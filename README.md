# Audio-Tokens: a toolbox for rating, sorting and comparing audio samples in the browser.

This is a Javascript toolbox to perform online rating studies with auditory material. The main feature of the toolbox is that audio samples are associated with visual tokens on the screen that control audio playback and can be manipulated depending on the type of rating. This allows the collection of single- and multi-dimensional feature ratings, as well as categorical and similarity ratings. The toolbox can be used via a plugin for the widely-used [jsPsych](https://www.jspsych.org), as well as using plain Javascript for custom applications.

## Screenshots

### Single feature rating

<img src="./imgs/figure_one_feature.png" alt="drawing" width="300"/>

### Multiple feature rating

<img src="./imgs/figure_three_features.png" alt="drawing" width="300"/>

### Sorting

<img src="./imgs/figure_cluster.png" alt="drawing" width="300"/>

### And more..

You can try the tools interactively in this [blog post](https://peterdonhauser.com/post/audio-ratings/) or read our preprint:

Donhauser, Peter, and Denise Klein. 2021. “Audio-tokens: A Toolbox for Rating, Sorting and Comparing Audio Samples in the Browser.” PsyArXiv. October 16. https://doi.org/10.31234/osf.io/3j58q

## Example script for jsPsych plugin

We go through the basic steps of setting up an experiment here. The complete experiment can be written in one html-file and will look like [this](https://pwdonh.github.io/audio_tokens/index_query.html?type=single_feature). This is the minimal page setup, excluding the jsPsych code:

```
<!DOCTYPE html>
<html>
    <head>
        <title>My experiment</title>
        <script src="scripts/jspsych.js"></script>
        <script src="scripts/jspsych-audio-tokens.js"></script>
        <script src="//d3js.org/d3.v4.min.js"></script>
        <script src="scripts/audio-tokens.js"></script>
        <link href="jspsych.css" rel="stylesheet" type="text/css">
    </head>
    <body>
    </body>
    <script>
       // All jsPsych code goes here
    </script>
</html>
```

Here we are first importing a few libraries: 
-	`d3.v4.min.js`: This is the d3-library on which the current toolbox is based, it is widely used for visualizing data in web environments
-	`audio-tokens.js`: This is the Javascript code for the rating tools described in this paper.
-	`jspsych.js`: This provides all the basic functionality of jsPsych
-	`jspsych-audio-tokens.js`: This is the plugin that allows us to include the rating tools in a jsPsych experiment
-	More jsPsych plugins can be loaded here in order to build your experiment, e.g. to display instructions

There is nothing written in between the `<body></body>` tags. This is normally where the content of a web page goes: here jsPsych takes care of displaying content according to the trial structure of the experiment.
In between the `<script></script>` tags we will add all the jsPsych code:

```
var single_feature_trial = {
    type: 'audio-tokens',
    ratingtype: 'features',
    stimuli: ['data/speaker1.wav',
              'data/speaker2.wav',
              'data/speaker3.wav',
              'data/speaker4.wav'],
    label: ['Feature 1'],
    anchors: [['low', '', 'high']],
    force_listen: false
}

jsPsych.init({
        timeline: [single_feature_trial],
        on_finish: function() {
          jsPsych.data.displayData();
        }
})
```

Here, `single_feature_trial` is the variable holding the parameters for a jsPsych trial:
-	`type`: Here we tell jsPsych to display a trial using our plugin called `audio-tokens`
-	`ratingtype`: This tells our plugin what rating type to use among the ones described in this paper. Options are: `features`, `features2d`, `categories`, `cluster`, `similarity`, `triplets`
-	`stimuli`: This is an array containing the file paths of the audio stimuli for this trial relative to the directory where the html file is stored.
-	`label`: This specifies the label to be displayed for a given rating dimension (e.g. valence, arousal, accentedness). See Fig. 1, the label on top of the arena.
-	`anchors`: This specifies the labels displayed as the endpoints of the rating dimensions (e.g. low-high, positive-neutral-negative)
-	`force_listen`: This, if set to `true`, checks whether the participant has listened to the whole audio file before allowing them to submit their ratings.

Then the call to `jsPsych.init` starts the experiment. In this case, the experiment timeline includes only one trial and the recorded data will be presented on the screen after the experiment is finished. The data is by default formatted in json, and for the example trial looks like the following:

```
[
	{
		"stimuli": [
			"data/speaker1.wav",
			"data/speaker2.wav",
			"data/speaker3.wav",
			"data/speaker4.wav"
		],
		"ratings": [
			0.3,
			0.22142857142857142,
			1,
			0.6071428571428571
		],
		"elapsed": [
			2.483076923076923,
			1.2666666666666666,
			1.1859259259259258,
			1.685840707964602
		],
		"rt": 6644,
		"ratingtype": "features",
		"labels": [
			"Feature 1"
		],
		"trial_type": "audio-tokens",
		"trial_index": 0,
		"time_elapsed": 11151,
		"internal_node_id": "0.0-0.0"
	}
]
```
The following fields are specific to our plugin: 
-	`ratings`: an array containing the rating the participant gave. This differs depending on the rating type. Here we get a number between 0 and 1 representing the horizontal placement of each token (0: left, 1: right). 
-	`elapsed`: an array containing the number of times a stimulus has been played by the participant. When hovering over a token, the corresponding audio stimulus is played in a loop. In this example, the first stimulus was played approximately two and a half times.
-	`rt`: the time, in milliseconds, from starting the trial to submitting the ratings
The fields `stimuli`, `ratingtype`, `labels` and `anchors` are equivalent to the parameters specified in the experiment script. The remaining fields are generic jsPsych outputs.

Please check the file [`index.html`](./index.html) for more examples.
