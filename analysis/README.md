## Python tool to convert results

jsPsych has the option to save the experiment results in json (as shown above) or csv format. However the results from an Audio-Tokens trial contain ratings for multiple stimuli. To simplify further analysis, we provide a python command-line tool that converts the data coming from jsPsych to a spreadsheet in "long format".

This requires Python 3 to be installed along with the packages pandas, numpy and scipy.

In a terminal, navigate to the folder where you saved the `audio_tokens.py` file. You can call the script like this:

```
python audio_tokens.py --infile example_results.csv --outfile converted/example_results
```

where the first argument `--infile` specifies the path to the jsPsych result file, and `--outfile` specifies the path where the outputs of the script should be stored. Depending on the types of ratings that are present in the jsPsych results, different output files will be generated, as described further below.

If you saved the data in json format, you can call the script equivalently:

```
python audio_tokens.py --infile example_results.json --outfile converted/example_results
```

