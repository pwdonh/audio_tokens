from app import app
from flask import render_template, request, redirect
import os, base64
from glob import glob

datapath = 'data'
audiofiles = glob(os.path.join(datapath,'*.wav'))
print(audiofiles)

@app.route('/')
@app.route('/index')
def index():
    return render_template('index.html')

@app.route('/get_audio', methods = ['POST','GET'])
def get_audio():
    if (request.method=='POST') & (request.is_json):
        JSON = request.get_json()
        audiofile_id = int(JSON['audiofile_id'])
        audiopath = audiofiles[audiofile_id]
    else:
        audiopath = audiofiles[0]
    with open(audiopath, 'rb') as f:
        data = f.read()
    wavstring = base64.b64encode(data).decode()
    response_json = {
            'audio': {'type': 'data:audio/wav',
                      'data': 'base64,'+wavstring}
        }
    return (response_json, 200)

@app.route('/post_trial', methods = ['POST','GET'])
def post_trial():
    if (request.method=='POST') & (request.is_json):
        JSON = request.get_json()
        print('Results:')
        print(JSON)
    return ({}, 200)
