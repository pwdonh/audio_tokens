from app import app
import os

if __name__ == '__main__':
    if (os.environ.get('PORT')):
        port = int(os.environ.get('PORT'))
    else:
        port = 5000
    app.run(host='0.0.0.0', port=port, debug=True)
