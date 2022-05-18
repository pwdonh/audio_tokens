import pandas as pd
import numpy as np
from scipy.spatial.distance import pdist, squareform
import json
import os
import argparse

def get_query_string(ratingtypes):
    query_string = '(trial_type=="audio-tokens")&({})'
    return query_string.format(
        '|'.join(
            ['(ratingtype=="{}")'.format(ratingtype) for ratingtype in ratingtypes]
            )
        )

def parse_json_strings(row, json_keys):
    # parse json strings (arrays)
    for key in json_keys:
        row[key] = json.loads(row[key])
    return row

def audiotokens_to_long(df, row_indices):

    # Generate empty table to hold data in long format
    df_long = pd.DataFrame(dict(
        stimulus=[], rating=[], label=[], trial_index=[], ratingtype=[], elapsed=[]
    ))
    i_stimulus = 0

    # Info to copy over to long format
    copy_keys = ['trial_index', 'ratingtype']

    # Loop through trials
    for row_index in row_indices:

        row = df.loc[row_index].copy()

        if row['ratingtype']=='cluster':
            # Get number of unique clusters
            clusters, all_ratings = np.unique(row['ratings'], return_inverse=True)
            cluster_names = ['cluster_{}'.format(
                i_cluster+1
                ) for i_cluster in range(len(clusters))]            
        else:
            all_ratings = row['ratings']

        # Loop through different ratings within a trial
        for stimulus, ratings, elapsed in zip(row['stimuli'], all_ratings, row['elapsed']):

            if row['ratingtype'] in ['features', 'features2d']:
                if len(row['labels'])==1:
                    ratings = [ratings]
                labels = row['labels']
            elif row['ratingtype']=='categories':
                # Output category labels instead of integers
                ratings = [row['labels'][ratings]]
                labels = ['category']
            elif row['ratingtype']=='cluster':
                # Output cluster labels instead of integers
                ratings = [cluster_names[ratings]]
                labels = ['cluster']

            # Generate one row per stimulus & rating (long format)
            for rating, label in zip(ratings, labels):
                df_long.loc[i_stimulus, 'stimulus'] = stimulus
                df_long.loc[i_stimulus, 'rating'] = rating
                df_long.loc[i_stimulus, 'elapsed'] = elapsed
                df_long.loc[i_stimulus, 'label'] = label
                for key in copy_keys:
                    df_long.loc[i_stimulus,key] = row[key]
                i_stimulus += 1

    df_long['trial_index'] = df_long['trial_index'].astype(int)

    return df_long

def compute_similarity_matrix(row):
    assert(row['ratingtype']=='similarity')
    similarity = squareform(1-pdist(row['ratings']))
    # make sure that similarity on the diagonal is 1
    similarity += np.eye(similarity.shape[0])
    assert(similarity[0,0]==1.)
    df_sim = pd.DataFrame(
        index=row['stimuli'], columns=row['stimuli'], data=similarity
    )    
    return df_sim

def parse_triplet_row(row):
    df_triplets = pd.DataFrame(dict(
        stim_0=[], stim_1=[], stim_2=[], selected=[], last_selected=[]
    ))
    selections = np.array(row['ratings'])
    selections[selections==None] = selections[selections!=None].max()+1
    stimuli = np.array(row['stimuli'])
    num_triplets = len(selections)-2
    triplet = np.arange(3).tolist()
    last_selected = 3
    for i_triplet in range(num_triplets):
        i_select = selections[triplet].argmin()
        df_triplets.loc[i_triplet, 'selected'] = i_select
        df_triplets.loc[i_triplet, ['stim_0', 'stim_1', 'stim_2']] = stimuli[triplet]
        df_triplets.loc[i_triplet, 'last_selected'] = last_selected
        triplet[i_select] = i_triplet+3
        last_selected = i_select
    df_triplets['selected'] = df_triplets['selected'].astype(int)
    df_triplets['last_selected'] = df_triplets['last_selected'].astype(int)
    df_triplets['trial_index'] = row['trial_index']
    return df_triplets

def triplets_to_long(df, row_indices):
    dfs_triplets = []
    for row_index in row_indices:
        row = df.loc[row_index].copy()
        df_triplets = parse_triplet_row(row)
        dfs_triplets.append(df_triplets)
    df_triplets = pd.concat(dfs_triplets)
    df_triplets['i_triplet'] = df_triplets.index 
    df_triplets.index = np.arange(df_triplets.shape[0])
    return df_triplets

def read_audio_tokens_csv(infile):
    df = pd.read_csv(infile)
    query_string = get_query_string(['features', 'features2d', 'categories', 'cluster'])
    row_indices = df.query(query_string).index
    for index in row_indices:
        row = df.loc[index].copy()
        df.loc[index] = parse_json_strings(row, ['stimuli', 'ratings', 'elapsed', 'labels'])
    query_string = get_query_string(['similarity', 'triplet'])
    row_indices = df.query(query_string).index
    # import pdb; pdb.set_trace()
    for index in row_indices:
        row = df.loc[index].copy()
        df.loc[index] = parse_json_strings(row, ['stimuli', 'ratings', 'elapsed'])
    return df

def read_audio_tokens_json(infile):
    df = pd.read_json(infile)
    return df

if __name__ == "__main__":

    parser = argparse.ArgumentParser()
    parser.add_argument('--infile', type=str)
    parser.add_argument('--outfile', type=str)
    args = parser.parse_args()    

    if os.path.splitext(args.infile)[1]=='.csv':
        df = read_audio_tokens_csv(args.infile)
    else:
        df = read_audio_tokens_json(args.infile)
    basepath = os.path.splitext(args.outfile)[0]

    # Process the trials of type features, features2d, categories, cluster
    # Those are cast in a long format where each row corresponds to a stimulus
    query_string = get_query_string(['features', 'features2d', 'categories', 'cluster'])
    row_indices = df.query(query_string).index
    if len(row_indices)>0:
        df_long = audiotokens_to_long(df, row_indices)
        df_long.to_csv(basepath+'_long.csv')

    # Process the trials of type similarity
    # Those are saved as similarity matrices trial by trial
    query_string = get_query_string(['similarity'])
    row_indices = df.query(query_string).index    
    for row_index in row_indices:
        df_sim = compute_similarity_matrix(df.loc[row_index].copy())
        trial_index = df.loc[row_index,'trial_index']
        df_sim.to_csv(basepath+'_similarity_trial{}.csv'.format(trial_index))

    # Process the trials of type triplets
    # Those are saved in a long format where each row corresponds to a triplet
    query_string = get_query_string(['triplet'])
    row_indices = df.query(query_string).index
    if len(row_indices)>0:
        df_long = triplets_to_long(df, row_indices)
        df_long.to_csv(basepath+'_triplets.csv')