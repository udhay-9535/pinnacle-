from flask import Flask, request, jsonify
import math

app = Flask(__name__)

@app.route('/evaluate', methods=['POST'])
def evaluate():
    data = request.get_json() or {}
    expr = data.get('expression','')
    try:
        # safe eval environment
        allowed = {k: getattr(math,k) for k in dir(math) if not k.startswith("_")}
        allowed['__builtins__'] = {}
        val = eval(expr, {"__builtins__":{}}, allowed)
        return jsonify({'result': val})
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@app.route('/explain', methods=['POST'])
def explain():
    expr = (request.get_json() or {}).get('expression','')
    return jsonify({'explanation': f"This expression computes {expr}."})

if __name__ == '__main__':
    app.run(debug=True)
