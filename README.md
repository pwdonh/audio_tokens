
```
python3 -m venv ./venv
source ./venv/bin/activate
pip install -r requirements.txt

PORT=5000 python app_ratings.py
```

Open in browser (Chrome/Firefox):

http://localhost:5000/index?type=accent&num_speakers=4

http://localhost:5000/index?type=clinical&num_speakers=4

http://localhost:5000/index?type=square&num_speakers=4

http://localhost:5000/index?type=similarity&num_speakers=8

http://localhost:5000/index?type=freesort&num_speakers=8

http://localhost:5000/index?type=triplets&num_speakers=8
