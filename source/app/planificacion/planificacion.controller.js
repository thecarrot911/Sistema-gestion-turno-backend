const { spawn } = require("child_process");
const { json } = require("express/lib/response");
const { planificacionModel } = require("../../model/planificacionModel");

const generarplanificacion = async(req, res) =>{
    try{
        let anio = parseInt(req.body.anio);
        let mes = parseInt(req.body.mes);
        let empleados = req.body.empleados;
        let cant_empleados = empleados.length
        let itinerario_json = req.body.itinerario;
        let planificacionMes = await planificacionModel.dias_mes_anterior(anio,mes);

        let control = planificacionMes.control;
        let planificacion = planificacionMes.consulta_planificacion;

        if(control){
            if(itinerario_json[0].dia== '' || ( itinerario_json[0].aviones == null && itinerario_json[0].dia == null )){
                itinerario = 0
            }
            else if((itinerario_json[0].dia!='') || ( itinerario_json[0].aviones != null && itinerario_json[0].dia != null )){
                itinerario = new Array()
                for(i=0;i<itinerario_json.length;i++){
                    let itinerario_array = new Array()
                    itinerario_array.push(String(itinerario_json[i].dia))
                    itinerario_array.push(String(itinerario_json[i].turno))
                    itinerario_array.push(String(itinerario_json[i].aviones))
                    itinerario.push(itinerario_array)
                }
            }

            let command = await spawn('python', ['source/app/planificacion/python/script.py',anio,mes,cant_empleados,itinerario])
            let planificacion = new Array(); //verificador para que la variable sea disitnto de vacio y tenga una respuesta.
            
            command.stdout.on ('data', function (data){
                console.log("Child process on")
                planificacion.push(data.toString());
                
            });
            command.stderr.on ('data', function (data){
                planificacion = data.toString();
            });
            command.on('close', async function(code){
                console.log("Child process close")
                //obj = planificacion[0].replace(/'/g,"\""); 

                let ultimo_empleado = await planificacionModel.ultimo_empleado_planificacion_anterior()

                jsonsend = JSON.parse(planificacion[0]);

                //turno_empleado = await planificacionModel.asignar_turno_empleado(planificacion[0],empleados);
                //jsonsend = JSON.parse(turno_empleado);
                
                ultimaPlanificacion = await planificacionModel.mostrar_ultima(anio)
                let indice = ultimaPlanificacion.planificacion.length - ultimaPlanificacion.planificacion.length%7
                
                let k = 0;
                for(let i = indice; i < ultimaPlanificacion.planificacion.length ;i++ ){
                    jsonsend[k].empleados = ultimaPlanificacion.planificacion[i].empleados
                    k++
                }
                
                planificacionEmpleado = await planificacionModel.asignar_turno_empleado(jsonsend ,empleados, k, ultimo_empleado);
                
                console.log(planificacionEmpleado)
                //planificacion_id = await planificacionModel.guardar(mes, anio, jsonsend);
                
                //ultimaPlanificacion = await planificacionModel.mostrar_ultima(anio)


                /*let json = {}
                json.planificacion_id = planificacion_id;
                json.planificacion = jsonsend;
                let json_send = JSON.stringify(json)
                return res.send(json_send);
                console.log(ultimaPlanificacion.data)*/

                return res.json({
                    error: false,
                    msg: "Última planificación",
                    data: jsonsend
                });
            });
            command.on('error', function(err){
                console.log('child process error')
                console.log(err);
                reject(err);
            });
        }
        else{
            meses_anio = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre", "Diciembre"]
            
            return res.json({
                error: true,
                msg: 'Ya existe una planificación para el mes de '+meses_anio[mes-1]
            });
        }
    }catch(e){
        return res.send(e)
    }

};
const planificacion_mostrar_todo = async(req,res) =>{
    try{
        let anio = req.query.anio;
        consulta_ultima_planificacion = await planificacionModel.mostrar_planificacion_anual(anio);
        return res.json({
            error: false,
            msg: "Planificaciones del año "+anio,
            data: consulta_ultima_planificacion
        });
    }catch(error){
        return res.json({
            error: true,
            msg: ''+error
        });
    }
};
const planificacion_mostrar_ultima = async(req,res)=>{
    try{
        consulta_ultima_planificacion = await planificacionModel.mostrar_ultima();
        return res.json({
            error: false,
            msg: "Última planificación",
            data: consulta_ultima_planificacion
        });
    }catch(error){
        return res.json({
            error: true,
            msg: ''+error
        });
    }
};

module.exports.planificacion_controller={
    generarplanificacion, 
    planificacion_mostrar_ultima,
    planificacion_mostrar_todo
}

