import React, {useState, useEffect} from 'react'
import {initializeApp} from 'firebase/app'
import {getAuth, signInAnonymously, onAuthStateChanged} from 'firebase/auth'
import{getFirestore, collection, addDoc, onSnapshot, deleteDoc, updateDoc,doc, query, orderBy} from 'firebase/firestore'



const configuracionFirebase ={
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
}


//arrancamos el servidor de la base de datos

const app = initializeApp(configuracionFirebase)
const autenticacion = getAuth(app) //inicio el usuario
const baseDeDatos = getFirestore(app) //inicio la base de datos



export default function App(){
//definimos los estados de nuestra aplicacion

const [usuario, setUsuario] = useState(null) //guardo los datos del usuario
const [listaDeTareas,setListaDeTareas] = useState([])
const [textoTarea, setTextoTarea] = useState("")
const [estaCargando, setEstaCargando] = useState(true)
const [idTareaEnEdicion, setIdTareaEnEdicion] = useState(null)


useEffect(   ()=>{
    signInAnonymously(autenticacion)
    return onAuthStateChanged(autenticacion,  (u)=>{
        setUsuario(u)

        if(!u) setEstaCargando(false)
 }) //aca escucho los cambios de la sesion
},[])



//si no hay usuario, quedate quieto. si hay usuario, trae las cosas y cuando termines deja de cargar
useEffect(  ()=>{
    if(!usuario) return  //si no hay usuario, no pedimos datos

    const consulta = query(collection(baseDeDatos, "tareas"), orderBy('fechaCreacion','desc'))
    //escucharmos la base de datos (onsnapsshot)
    const desuscribir = onSnapshot(consulta, (instantanea)=>{
        setListaDeTareas(instantanea.doc.map( (d)=>{id: d.id}, ...d.data()))})
        estaCargando(false)

        return ()=> desuscribir()  //al cerrar la app, dejo de escuchar la base de datos

},[usuario]) //se activa cuando el usuario se loguea


//funcion para manejar el envio del formulario (crear o editar)

const enviarTarea = async (e)=> {
    e.preventDefault()
    if(!textoTarea.trim()) return  //si el texto esta vacio, no hacemos nada

    if(idTareaEnEdicion){//Si tenemos un id guardado, se edita
        await updateDoc(doc(baseDeDatos,'tareas', idTareaEnEdicion), {descripcion: textoTarea})
        setIdTareaEnEdicion(null)
    }else{// si no hay un ID, Creamos una tarea
        await addDoc(collection(baseDeDatos,'tareas'),{
            descripcion: textoTarea, 
            completada:false, 
            fechaCreacion: Date.now()
        }) //guardar el texto
    }
    setTextoTarea("") //limpiamos el campo de texto para poder crear una nueva tarea
}

//funcion para preparar el formulario para editar
const activarEdicion = (tarea)=>{
    setTextoTarea(tarea.descripcion) //pasamos la tarea del texto del input
    setIdTareaEnEdicion(tarea.id) //guardar el id para saber que tarea es
    }

    //si aun no se conecta, mostramos la pantalla de carga

    if(estaCargando) return <div> Cargando Aplicación </div>


    return(
        <div>
            <h1>ABM de Prueba</h1>
        </div>
    )




}