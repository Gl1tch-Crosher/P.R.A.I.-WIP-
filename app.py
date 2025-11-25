import sqlite3
from flask import Flask, jsonify, request, g
from datetime import datetime

app = Flask(__name__)
DATABASE = 'PRAI_DB.sqlite'

# --- Configuración de Conexión a Base de Datos ---

def get_db():
    """Establece la conexión a la base de datos."""
    db = getattr(g, '_database', None)
    if db is None:
        db = g._database = sqlite3.connect(DATABASE)
        db.row_factory = sqlite3.Row  # Permite acceder a las filas por nombre de columna
    return db

@app.teardown_appcontext
def close_connection(exception):
    """Cierra la conexión a la base de datos al finalizar la petición."""
    db = getattr(g, '_database', None)
    if db is not None:
        db.close()

# --- Rutas CRUD para ROBOT (Prioridad Absoluta) ---

@app.route('/api/robots', methods=['GET'])
def get_robots():
    """Leer todos los robots."""
    db = get_db()
    # Nota: El frontend espera 'name' y 'type'. Usaremos 'nombre' y 'tipo' del modelo.
    # Por defecto, Robot solo tiene 'tipo' y 'estado'. Asumimos que la DB tiene 'nombre'. 
    # Si no tiene 'nombre', adapta la query a: SELECT id, tipo AS name, tipo, estado AS status FROM Robot
    # Usaremos una consulta genérica y haremos el mapeo en Python para compatibilidad con el JS anterior.
    
    cursor = db.execute('SELECT id, tipo, estado FROM Robot')
    robots_data = cursor.fetchall()
    
    robots_list = []
    for row in robots_data:
        robots_list.append({
            'id': row['id'],
            'name': f"Robot {row['id']} - {row['tipo']}", # Placeholder para 'name'
            'type': row['tipo'],
            'status': row['estado']
        })
    
    return jsonify(robots_list)

@app.route('/api/robots', methods=['POST'])
def create_robot():
    """Crear un nuevo robot."""
    new_robot = request.json
    db = get_db()
    try:
        cursor = db.execute(
            "INSERT INTO Robot (tipo, estado) VALUES (?, ?)", 
            (new_robot.get('type'), new_robot.get('status'))
        )
        db.commit()
        return jsonify({'message': 'Robot creado con éxito', 'id': cursor.lastrowid}), 201
    except sqlite3.IntegrityError:
        return jsonify({'error': 'Error de integridad al crear el robot.'}), 400

@app.route('/api/robots/<int:robot_id>', methods=['PUT'])
def update_robot(robot_id):
    """Actualizar un robot existente."""
    updated_data = request.json
    db = get_db()
    cursor = db.execute(
        "UPDATE Robot SET tipo = ?, estado = ? WHERE id = ?",
        (updated_data.get('type'), updated_data.get('status'), robot_id)
    )
    db.commit()
    if cursor.rowcount == 0:
        return jsonify({'error': 'Robot no encontrado'}), 404
    return jsonify({'message': f'Robot {robot_id} actualizado con éxito'})

@app.route('/api/robots/<int:robot_id>', methods=['DELETE'])
def delete_robot(robot_id):
    """Eliminar un robot."""
    db = get_db()
    cursor = db.execute("DELETE FROM Robot WHERE id = ?", (robot_id,))
    db.commit()
    if cursor.rowcount == 0:
        return jsonify({'error': 'Robot no encontrado'}), 404
    return jsonify({'message': f'Robot {robot_id} eliminado con éxito'})


# --- Rutas CRUD para CLIENTE (Ampliación) ---

@app.route('/api/clientes', methods=['GET'])
def get_clientes():
    """Leer todos los clientes."""
    db = get_db()
    # Mapeo: Cliente.nombre (nombre de la persona) -> name; Cliente.empresa -> contact/company. 
    cursor = db.execute('SELECT id, nombre, empresa, contacto FROM Cliente')
    clientes_data = cursor.fetchall()
    
    clientes_list = []
    for row in clientes_data:
        clientes_list.append({
            'id': row['id'],
            'name': row['empresa'],       # Nombre de la empresa
            'contact': row['contacto'],   # Contacto principal
            'email': 'N/A',               # Email no está en el esquema DB, se pone 'N/A'
            'status': 'Activo'            # Status no está en la DB, se pone 'Activo' por defecto
        })
    return jsonify(clientes_list)

# --- Nueva Ruta CRUD para CLIENTE (Creación) ---

@app.route('/api/clientes', methods=['POST'])
def crear_cliente():
    """Crea un nuevo cliente en la base de datos."""
    db = get_db()
    
    # 1. Obtener los datos JSON enviados por el Front-End
    datos_cliente = request.get_json()
    if datos_cliente is None:
        return jsonify({'message': 'No se recibieron datos o el formato es inválido (debe ser JSON).'}), 400
    
    # 2. Extraer los campos requeridos.
    nombre = datos_cliente.get('nombre')
    empresa = datos_cliente.get('empresa')
    contacto = datos_cliente.get('contacto')
    
    # 3. Validación básica
    if not nombre or not empresa or not contacto:
        return jsonify({'message': 'Faltan campos obligatorios (nombre, empresa, contacto).'}), 400

    try:
        # 4. Ejecutar la inserción en la tabla Cliente
        cursor = db.execute(
            "INSERT INTO Cliente (nombre, empresa, contacto) VALUES (?, ?, ?)", 
            (nombre, empresa, contacto)
        )
        db.commit() # Confirmar la transacción
        
        # 5. Devolver una respuesta exitosa
        return jsonify({
            'message': 'Cliente creado exitosamente.',
            'id': cursor.lastrowid,
            'nombre': nombre
        }), 201 # 201 es el código estándar para 'Creado'

    except sqlite3.IntegrityError as e:
        # Maneja errores de DB (ej. si hay restricción UNIQUE y se viola)
        return jsonify({'error': f'Error de integridad de base de datos: {e}'}), 400
    except Exception as e:
        # Maneja cualquier otro error no esperado
        db.rollback() # Deshacer si algo falló
        return jsonify({'error': f'Error interno del servidor: {e}'}), 500

# --- Rutas para SIMULACIÓN (Tarea/Solicitud) ---

@app.route('/api/simulacion/solicitud', methods=['POST'])
def create_solicitud():
    """Registra una nueva Solicitud para iniciar una simulación de proceso."""
    solicitud_data = request.json
    db = get_db()
    
    # 1. Encontrar el cliente (asumiendo que el cliente.id viene en el request)
    cliente_id = solicitud_data.get('client_id')
    
    try:
        # 2. Insertar la Solicitud
        cursor_sol = db.execute(
            "INSERT INTO Solicitud (fecha, descripcion, cliente_id) VALUES (?, ?, ?)",
            (datetime.now().strftime("%Y-%m-%d"), solicitud_data.get('task_description'), cliente_id)
        )
        solicitud_id = cursor_sol.lastrowid
        
        # 3. Insertar la Tarea asociada
        db.execute(
            "INSERT INTO Tarea (nombre, duracion, prioridad, robot_id) VALUES (?, ?, ?, ?)",
            (solicitud_data.get('task_name'), solicitud_data.get('duration', 'N/A'), solicitud_data.get('priority', 'Media'), solicitud_data.get('robot_id'))
        )
        
        db.commit()
        return jsonify({
            'message': 'Solicitud y Tarea registradas con éxito.',
            'solicitud_id': solicitud_id,
            'status': 'Pendiente' # El backend establece el estado inicial
        }), 201

    except sqlite3.IntegrityError as e:
        return jsonify({'error': f'Error de integridad: {e}'}), 400
    except Exception as e:
        db.rollback()
        return jsonify({'error': f'Error en el proceso de solicitud: {e}'}), 500


if __name__ == '__main__':
    # Para la prueba local, permite llamadas desde el frontend
    from flask_cors import CORS
    CORS(app) 
    app.run(debug=True, port=5000)
