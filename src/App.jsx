import React, {useState, useEffect} from 'react'
import {initializeApp} from 'firebase/app'
import {getAuth, signInAnonymously, onAuthStateChanged} from 'firebase/auth'
import{getFirestore, collection, addDoc, onSnapshot, deleteDoc, updateDoc,doc, query, orderBy} from 'firebase/firestore'
import {CheckCircle, Circle, Edit2, Trash2} from 'lucide-react'

const configuracionFirebase ={
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
}

//arrancamos el servidor de la base de datos

const app = initializeApp(configuracionFirebase);
const autenticacion = getAuth(app); //inicio el usuario
const baseDeDatos = getFirestore(app); //inicio la base de datos

export default function App() {
  //definimos los estados de nuestra aplicacion

  const [usuario, setUsuario] = useState(null); //guardo los datos del usuario
  const [listaDeTareas, setListaDeTareas] = useState([]); //guardo la lista de tareas
  const [textoTarea, setTextoTarea] = useState(''); //guardo el texto del input
  const [estaCargando, setEstaCargando] = useState(true); //controlo la pantalla de carga
  const [idTareaEnEdicion, setIdTareaEnEdicion] = useState(null); //guardo el id de la tarea que estoy editando

  //cuando la app arranca, inicio sesion anonima y escucho los cambios de la sesion
  useEffect(() => {
    signInAnonymously(autenticacion);
    return onAuthStateChanged(autenticacion, (u) => {
      setUsuario(u);
      if (!u) setEstaCargando(false);
    }); //aca escucho los cambios de la sesion
  }, []);

  //si no hay usuario, quedate quieto. si hay usuario, trae las cosas y cuando termines deja de cargar
  useEffect(() => {
    if (!usuario) return; //si no hay usuario, no pedimos datos

    const consulta = query(
      collection(baseDeDatos, 'tareas'),
      orderBy('fechaCreacion', 'desc')
    );

    //escuchamos la base de datos (onSnapshot)
    const desuscribir = onSnapshot(consulta, (instantanea) => {
      setListaDeTareas(
        instantanea.docs.map(d => ({ id: d.id, ...d.data() }))
      );
      setEstaCargando(false);
    });

    return () => desuscribir(); //al cerrar la app, dejo de escuchar la base de datos
  }, [usuario]); //se activa cuando el usuario se loguea

  //funcion para manejar el envio del formulario (crear o editar)
  const enviarTarea = async (e) => {
    e.preventDefault();
    if (!textoTarea.trim()) return; //si el texto esta vacio, no hacemos nada

    if (idTareaEnEdicion) { //Si tenemos un id guardado, se edita
      await updateDoc(
        doc(baseDeDatos, 'tareas', idTareaEnEdicion),
        { descripcion: textoTarea }
      );
      setIdTareaEnEdicion(null);
    } else { //si no hay un ID, creamos una tarea nueva
      await addDoc(collection(baseDeDatos, 'tareas'), {
        descripcion: textoTarea,
        completada: false,
        fechaCreacion: Date.now()
      }); //guardar el texto
    }

    setTextoTarea(''); //limpiamos el campo de texto para poder crear una nueva tarea
  };

  //funcion para preparar el formulario para editar
  const activarEdicion = (tarea) => {
    setTextoTarea(tarea.descripcion); //pasamos la tarea del texto del input
    setIdTareaEnEdicion(tarea.id); //guardar el id para saber que tarea es
  };

  //si aun no se conecta, mostramos la pantalla de carga
  if (estaCargando) {
    return <div style={estilos.pantalla}>Cargando aplicación...</div>;
  }

  return (
    <div style={estilos.pantalla}>
      <div style={estilos.tarjeta}>
        <h2 style={{ textAlign: 'center', color: '#333' }}>ABM TERMINADO</h2>

        {/* formulario para crear o editar tareas */}
        <form onSubmit={enviarTarea} style={estilos.formulario}>
          <input
            style={{
              ...estilos.entrada,
              borderColor: idTareaEnEdicion ? '#f97316' : '#ddd'
            }}
            value={textoTarea}
            onChange={(e) => setTextoTarea(e.target.value)}
            placeholder={
              idTareaEnEdicion
                ? "modificando"
                : "que tarea queres agregar?"
            }
          />
          <button
            type="submit"
            style={{
              ...estilos.boton,
              backgroundColor: idTareaEnEdicion ? 'red' : 'green'
            }}
          >
            {idTareaEnEdicion ? 'modificar' : 'agregar'}
          </button>
        </form>

        {/* lista de tareas */}
        <div style={estilos.contenedorLista}>
          {listaDeTareas.map(tarea => (
            <div key={tarea.id} style={estilos.itemTarea}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  flex: 1
                }}
              >
                {/* icono para marcar como completada */}
                <div
                  onClick={() =>
                    updateDoc(
                      doc(baseDeDatos, 'tareas', tarea.id),
                      { completada: !tarea.completada }
                    )
                  }
                  style={{ cursor: 'pointer' }}
                >
                  {tarea.completada
                    ? <CheckCircle color="green" size={20} />
                    : <Circle color="#ccc" size={20} />}
                </div>

                {/* texto de la tarea, tachado si esta completada */}
                <span
                  style={{
                    marginLeft: '10px',
                    textDecoration: tarea.completada
                      ? 'line-through'
                      : 'none',
                    color: tarea.completada
                      ? '#aaa'
                      : '#333'
                  }}
                >
                  {tarea.descripcion}
                </span>
              </div>

              {/* botones de editar y eliminar */}
              <div style={{ display: 'flex', gap: '10px' }}>
                <Edit2
                  size={18}
                  color="#f97316"
                  style={{ cursor: 'pointer' }}
                  onClick={() => activarEdicion(tarea)}
                />
                <Trash2
                  size={18}
                  color="#ff4d4d"
                  style={{ cursor: 'pointer' }}
                  onClick={() =>
                    deleteDoc(
                      doc(baseDeDatos, 'tareas', tarea.id)
                    )
                  }
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

//estilos de la aplicacion
const estilos = {
  pantalla: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100vw',
    height: '100vh',
    position: 'fixed',
    top: 0,
    left: 0,
    backgroundColor: '#f5f7fa',
    fontFamily: 'sans-serif'
  },
  tarjeta: {
    backgroundColor: 'white',
    padding: '30px',
    borderRadius: '20px',
    boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
    width: '90%',
    maxWidth: '400px'
  },
  formulario: {
    display: 'flex',
    gap: '10px',
    marginBottom: '20px'
  },
  entrada: {
    flex: 1,
    padding: '12px',
    borderRadius: '10px',
    border: '2px solid',
    fontSize: '16px',
    outline: 'none',
    transition: '0.3s'
  },
  boton: {
    padding: '0 20px',
    color: 'white',
    border: 'none',
    borderRadius: '10px',
    fontSize: '20px',
    cursor: 'pointer',
    transition: '0.3s'
  },
  contenedorLista: {
    maxHeight: '350px',
    overflowY: 'auto'
  },
  itemTarea: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '15px 0',
    borderBottom: '1px solid #f0f0f0'
  }
};