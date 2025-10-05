#!/usr/bin/env python3
"""
Proxy simples para APIs do Roblox
Resolve problemas de CORS permitindo que o site acesse as APIs do Roblox
"""

from flask import Flask, jsonify, request
from flask_cors import CORS
import requests

app = Flask(__name__)
CORS(app)  # Permitir todas as origens

@app.route('/api/universe/<place_id>', methods=['GET'])
def get_universe(place_id):
    """Converter PlaceId em UniverseId"""
    try:
        url = f'https://apis.roblox.com/universes/v1/places/{place_id}/universe'
        response = requests.get(url, timeout=10)
        return jsonify(response.json()), response.status_code
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/games/<universe_ids>', methods=['GET'])
def get_games(universe_ids):
    """Obter detalhes do jogo"""
    try:
        url = f'https://games.roblox.com/v1/games?universeIds={universe_ids}'
        response = requests.get(url, timeout=10)
        return jsonify(response.json()), response.status_code
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/thumbnails/<universe_ids>', methods=['GET'])
def get_thumbnails(universe_ids):
    """Obter thumbnail do jogo"""
    try:
        url = f'https://thumbnails.roblox.com/v1/games/icons?universeIds={universe_ids}&size=512x512&format=Png&isCircular=false'
        response = requests.get(url, timeout=10)
        return jsonify(response.json()), response.status_code
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/users/<user_id>', methods=['GET'])
def get_user(user_id):
    """Obter informações do usuário"""
    try:
        url = f'https://users.roblox.com/v1/users/{user_id}'
        response = requests.get(url, timeout=10)
        return jsonify(response.json()), response.status_code
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/groups/<group_id>', methods=['GET'])
def get_group(group_id):
    """Obter informações do grupo"""
    try:
        url = f'https://groups.roblox.com/v1/groups/{group_id}'
        response = requests.get(url, timeout=10)
        return jsonify(response.json()), response.status_code
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/health', methods=['GET'])
def health():
    """Verificar se o proxy está funcionando"""
    return jsonify({'status': 'ok', 'message': 'Roblox Proxy está funcionando!'}), 200

if __name__ == '__main__':
    print('=' * 60)
    print('Roblox API Proxy iniciado!')
    print('=' * 60)
    print('Servidor rodando em: http://localhost:5000')
    print('Endpoints disponíveis:')
    print('  - GET /health')
    print('  - GET /api/universe/<place_id>')
    print('  - GET /api/games/<universe_ids>')
    print('  - GET /api/thumbnails/<universe_ids>')
    print('  - GET /api/users/<user_id>')
    print('  - GET /api/groups/<group_id>')
    print('=' * 60)
    print('Mantenha este servidor rodando enquanto usa o painel!')
    print('=' * 60)
    app.run(host='0.0.0.0', port=5000, debug=False)
