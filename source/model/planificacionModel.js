const { json } = require("express/lib/response");
const conexion = require("../database");

const ultimo_empleado_planificacion_anterior = async()=>{
    let string_sql_ultima_planificacion = 
    `SELECT MAX(${process.env.NOMBRE_BD}.planificacion.planificacion_id) planificacion_id 
    FROM ${process.env.NOMBRE_BD}.planificacion`
    
    consulta_ultima_planificacion = await conexion.query(string_sql_ultima_planificacion);
    
    let string_sql_ultimo_dia =
    `SELECT MAX(dia.dia_id) dia_id
    FROM ${process.env.NOMBRE_BD}.dia dia WHERE dia.planificacion_id = ${consulta_ultima_planificacion[0].planificacion_id}`

    consulta_ultimo_dia = await conexion.query(string_sql_ultimo_dia);

    let string_sql_empleado = 
    `SELECT empleado.nombre 
    FROM ${process.env.NOMBRE_BD}.empleado empleado
    WHERE empleado.dia_id = ${consulta_ultimo_dia[0].dia_id} and turno='23:00 a 07:00';
    `
    consulta_empleado_ultimo_dia = await conexion.query(string_sql_empleado)
    return consulta_empleado_ultimo_dia
};
const existe_mes_anterior = async(anio,numero_mes,cant_empleados)=>{
    let turno = ['Libre','07:00 a 15:00','15:00 a 23:00','23:00 a 07:00'];
    
    let meses = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre", "Diciembre"]
    let mes = meses[numero_mes-1]

    let planificacionAnterior_anio;
    let planificacionAnterior_mes;

    if(mes == "Enero"){
        planificacionAnterior_anio  = anio - 1
        planificacionAnterior_mes   = 'Diciembre'
    }
    else{
        planificacionAnterior_anio  = anio
        planificacionAnterior_mes   = meses[numero_mes-2]
    }

    let string_sql_planificacion = 
    `SELECT * 
    FROM ${process.env.NOMBRE_BD}.planificacion 
    where month = '${planificacionAnterior_mes}' and year = ${planificacionAnterior_anio};
    `

    let consultaPlanificacion = await conexion.query(string_sql_planificacion);
    let planificacionAnterior;
    let copyPlanificacion;

    if(consultaPlanificacion.length!=0){ 
        let planificacion_id = consultaPlanificacion[0].planificacion_id;

        let string_sql_planificacionDia = 
        `SELECT planificacion.planificacion_id, planificacion.month mes, planificacion.year a??o, 
        dia.dia_id, dia.dia_semana, dia.dia_numero, dia.comodin, 
        empleado.nombre, empleado.nombre_id,empleado.turno, empleado.empleado_id 
        FROM ${process.env.NOMBRE_BD}.planificacion planificacion, ${process.env.NOMBRE_BD}.empleado empleado,${process.env.NOMBRE_BD}.dia dia 
        WHERE planificacion.planificacion_id = ${planificacion_id} and dia.planificacion_id = ${planificacion_id}
        and dia.dia_id = empleado.dia_id
        ORDER BY dia.dia_id DESC;`;
        
        let consulta_planificacion = await conexion.query(string_sql_planificacionDia);
        copyPlanificacion = consulta_planificacion;
        planificacionAnterior = new Array();

        for(let i = 0;i<30;i=i+5){
            if(consulta_planificacion[i].dia_semana == 'Lunes'){
                let empleados = new Array()
                let cont_emp = 1;
                for(let j = i; j<i+cant_empleados ;j++){
                    for(let t = 0 ; t<turno.length; t++){
                        if(consulta_planificacion[j].turno == turno[t]){
                            empleados.push([t,cont_emp])
                            cont_emp++;
                            break;
                        }
                    }
                }
                planificacionAnterior.unshift([consulta_planificacion[i].dia_numero,empleados])
                break;
            }
            else{
                let empleados = new Array()
                //let cont_emp = 1;
                for(let j = i; j<i+cant_empleados ;j++){
                    for(let t = 0 ; t<turno.length; t++){
                        if(consulta_planificacion[j].turno == turno[t]){
                            empleados.push([t,consulta_planificacion[j].nombre_id])
                            //cont_emp++;
                            break;
                        }
                    }
                }
                planificacionAnterior.unshift([consulta_planificacion[i].dia_numero,empleados])
            }
        }
    }else{
        planificacionAnterior = 0
    }
    //console.log(planificacionAnterior)
    //console.log(copyPlanificacion)
    return { planificacionAnterior,copyPlanificacion} ;
};
const existe_planificacion = async(anio,numero_mes)=>{
    let meses = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre", "Diciembre"]
    let mes_planificacion = meses[numero_mes-1];
    
    let string_sql = 
    `
    SELECT * FROM  ${process.env.NOMBRE_BD}.planificacion 
    WHERE month = '${mes_planificacion}' and year = ${anio};
    `

    let consulta_planificacion = await conexion.query(string_sql);
    let control;

    if(consulta_planificacion.length == 0) control = true;
    else control = false

    return {control , consulta_planificacion};
};

const asignar_turno_empleado = async(obj, empleados)=>{
    
    let turno = ['"Libre"','"07:00 a 15:00"','"15:00 a 23:00"','"23:00 a 07:00"'];

    let array_empleados = new Array(5);
    array_empleados[0] = empleados[0].nombre 
    array_empleados[1] = empleados[1].nombre
    array_empleados[2] = empleados[2].nombre
    array_empleados[3] = empleados[3].nombre
    array_empleados[4] = empleados[4].nombre 

    array_empleados = array_empleados.sort(function() {return Math.random() - 0.5});
    //console.log(obj)
    //Asignaci??n de turno
    for (i = 1;i<=array_empleados.length;i++){
        obj = obj.replaceAll('"nombre": '+i,'"nombre": "'+array_empleados[i-1]+'"');
    }
    
    //Reemplazo de los numeros por horas
    for (i=0; i<=3;i++){
        obj = obj.replaceAll('"turno": '+i,'"turno": '+turno[i]);
        obj = obj.replaceAll('"comodin": '+i,'"comodin": '+turno[i])
        obj = obj.replaceAll('"turno_itinerario": '+i,'"turno_itinerario": '+turno[i]);
    }
    return obj;
};

const asignar_nombre_ultima_semana = async(jsonsend,planificacionUltimaSemana,cant_empleados,empleados)=>{

    //console.log(jsonsend[0])
    //console.log("_-_")
    //console.log(planificacionUltimaSemana[0])
    //console.log(planificacionUltimaSemana[5])

    //planificacionUltimaSemana: EMPIEZA DESDE EL ULTIMO DIA DEL MES PASADO
    //jsonsend: EMPIEZA DEL PRIMER DIA DE LA PRIMERA SEMANA DLE MES PASADO

    var cantidadDiasSemanaMesAnterior = 0
    for(let i=0;i<planificacionUltimaSemana.length;i=i+5){
        if(planificacionUltimaSemana[i].dia_semana == 'Lunes'){
            cantidadDiasSemanaMesAnterior++;
            break;
        }else{
            cantidadDiasSemanaMesAnterior++;
        }
    }

    if(cantidadDiasSemanaMesAnterior>0){
        for(let i=0;i<planificacionUltimaSemana.length; i=i+5){
            if(planificacionUltimaSemana[i].dia_semana == 'Lunes'){
                for(let j=i;j<i+cant_empleados;j++){
                    for(let k=0;k<cant_empleados;k++){
                        if(planificacionUltimaSemana[j].nombre_id == jsonsend[cantidadDiasSemanaMesAnterior-1].empleados[k].nombre_id){
                            jsonsend[cantidadDiasSemanaMesAnterior-1].empleados[k].nombre = planificacionUltimaSemana[j].nombre
                        }
                    }
                }
                cantidadDiasSemanaMesAnterior = cantidadDiasSemanaMesAnterior - 1
                break;
            }
            else{
                console.log(jsonsend[cantidadDiasSemanaMesAnterior-1])

                for(let j=i;j<i+cant_empleados;j++){
                    for(let k=0;k<cant_empleados;k++){
                        if(planificacionUltimaSemana[j].nombre_id == jsonsend[cantidadDiasSemanaMesAnterior-1].empleados[k].nombre_id){

                            jsonsend[cantidadDiasSemanaMesAnterior-1].empleados[k].nombre = planificacionUltimaSemana[j].nombre
                        }
                    }
                }
                cantidadDiasSemanaMesAnterior = cantidadDiasSemanaMesAnterior - 1

            }
        }
    }
    return jsonsend
};

const guardar = async(month, year, planificacion)=>{
    let meses_anio = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre", "Diciembre"]
    let mes = meses_anio[month-1]
    let string_sql = "INSERT INTO "+process.env.NOMBRE_BD+".planificacion(month, year) VALUES('"+mes+"','"+year+"');";
    
    //Inserci??n de la planificaci??n
    let insert_planificacion = await conexion.query(string_sql);
    let planificacion_id = insert_planificacion.insertId;
    let dia_semana;
    let numero_dia;
    let comodin;

    // Inserci??n del d??a 
    for(i=0;i<planificacion.length;i++){
        dia_semana = planificacion[i].dia_semana
        numero_dia = planificacion[i].numero_dia
        comodin = planificacion[i].comodin
        let string_sql_dia = "INSERT INTO "+process.env.NOMBRE_BD+".dia(planificacion_id, dia_semana, dia_numero, comodin) VALUES('"+planificacion_id+"','"+dia_semana+"','"+numero_dia+"','"+comodin+"')";

        let insert_dia = await conexion.query(string_sql_dia);
        dia_id = insert_dia.insertId

        // Inserci??n de empleados
        for(j=0;j<planificacion[i].empleados.length;j++){
            let nombre = planificacion[i].empleados[j].nombre
            let nombre_id = planificacion[i].empleados[j].nombre_id
            let turno = planificacion[i].empleados[j].turno
            let string_sql_empleado = "INSERT INTO "+process.env.NOMBRE_BD+".empleado(dia_id, nombre, nombre_id, turno) VALUES('"+dia_id+"','"+nombre+"','"+nombre_id+"','"+turno+"')";
            await conexion.query(string_sql_empleado);
        }

        // Inserci??n de itinerario
        if(planificacion[i].itinerario !=0)
        {
            for(k=0;k<planificacion[i].itinerario.length;k++){
                turno = planificacion[i].itinerario[k].turno_itinerario
                empleado_faltante = planificacion[i].itinerario[k].falta
                let string_sql_itinerario = "INSERT INTO "+process.env.NOMBRE_BD+".itinerario(dia_id, turno, empleado_faltante) VALUES('"+dia_id+"','"+turno+"','"+empleado_faltante+"')";
                await conexion.query(string_sql_itinerario)
            }
        }
    }
    return planificacion_id;
};

const mostrar_planificacion_anual = async(anio) =>{
    try{
        let string_sql_planificacion = `
    SELECT planificacion_id, month 
    FROM ${process.env.NOMBRE_BD}.planificacion 
    WHERE year = ${anio};`;
    let planificaciones = await conexion.query(string_sql_planificacion);
    
    let array_planificaciones = new Array();
    for(let x = 0; x < planificaciones.length ;x++){
        let json_planificacion = {};
        
        let string_sql_planificacion = 
        `SELECT planificacion.planificacion_id, planificacion.month mes, planificacion.year a??o, 
        dia.dia_id, dia.dia_semana, dia.dia_numero, dia.comodin, 
        empleado.nombre, empleado.turno, empleado.empleado_id 
        FROM ${process.env.NOMBRE_BD}.planificacion planificacion, ${process.env.NOMBRE_BD}.empleado empleado,${process.env.NOMBRE_BD}.dia dia 
        WHERE planificacion.planificacion_id = ${planificaciones[x].planificacion_id} and dia.planificacion_id = ${planificaciones[x].planificacion_id}
        and dia.dia_id = empleado.dia_id
        ORDER BY dia.dia_id ASC`;
        
        let consulta_planificacion = await conexion.query(string_sql_planificacion);

        let string_sql_itinerario =
        `SELECT itinerario.turno, itinerario.empleado_faltante, dia.dia_id
        FROM ${process.env.NOMBRE_BD}.itinerario itinerario, ${process.env.NOMBRE_BD}.dia dia, ${process.env.NOMBRE_BD}.planificacion planificacion
        WHERE dia.dia_id = itinerario.dia_id 
        AND  dia.planificacion_id = planificacion.planificacion_id 
        AND planificacion.planificacion_id = ${planificaciones[x].planificacion_id};`;

        let consulta_itinerario = await conexion.query(string_sql_itinerario);
        let array_itinerario = new Array()

        for(k=0;k<consulta_itinerario.length;k++){
            dic_itinerario={}
            dic_itinerario.turno_itinerario = consulta_itinerario[k].turno;
            dic_itinerario.empleado_faltante = consulta_itinerario[k].empleado_faltante;
            dic_itinerario.dia_id = consulta_itinerario[k].dia_id;
            array_itinerario.push(dic_itinerario);
        }
        let json={}
        let array_dia = new Array();
        for(i=0;i<consulta_planificacion.length; i=i+5){
            if(i==0){
                json.planificacion_id = consulta_planificacion[0].planificacion_id 
                json.mes = consulta_planificacion[0].mes 
                json.anio = consulta_planificacion[0].a??o 
            }
            let mini_json={}
            let array_empleados = new Array();
            
            mini_json.dia_semana = consulta_planificacion[i].dia_semana
            mini_json.numero_dia = consulta_planificacion[i].dia_numero
            
            let indice = 0
            for(j=i;indice<5;j++){
                let empleado = {}
                empleado.nombre = consulta_planificacion[j].nombre
                empleado.turno = consulta_planificacion[j].turno
                array_empleados.push(empleado)
                indice++;
            }
            mini_json.empleados = array_empleados
            let array_new_itinerario = new Array()
            let control;
            
            for(let h = 0; h<array_itinerario.length ;h++){
                if(array_itinerario[h].dia_id == consulta_planificacion[i].dia_id){
                    let dic_itinerario = {}
                    dic_itinerario.turno_itinerario = array_itinerario[h].turno_itinerario
                    dic_itinerario.falta = array_itinerario[h].empleado_faltante
                    array_new_itinerario.push(dic_itinerario)
                }
            }
            mini_json.itinerario = array_new_itinerario
            mini_json.comodin = consulta_planificacion[i].comodin

            array_dia.push(mini_json)
        }

        let string_sql_actualizacion = 
        `SELECT actualizacion.actualizacion_id, actualizacion.tipo_permiso,
        actualizacion.descripcion, actualizacion.empleado, 
        DATE_FORMAT(actualizacion.fecha, '%Y-%m-%d') fecha, 
        actualizacion.planificacion_id
        FROM ${process.env.NOMBRE_BD}.planificacion planificacion, ${process.env.NOMBRE_BD}.actualizacion actualizacion
        where ${process.env.NOMBRE_BD}.planificacion.planificacion_id = ${process.env.NOMBRE_BD}.actualizacion.planificacion_id and ${process.env.NOMBRE_BD}.planificacion.planificacion_id = ${planificaciones[x].planificacion_id};
        `
    
        let consulta_actualizacion = await conexion.query(string_sql_actualizacion)
        json.actualizacion = consulta_actualizacion
        json.planificacion = array_dia;
        array_planificaciones.push(json);
    }
    return array_planificaciones;
    }catch(error){
        console.log(error)
        return error;
    }
};

const mostrar_ultima = async()=>{
    let string_sql_id_max_planificacion = "SELECT MAX("+process.env.NOMBRE_BD+".planificacion.planificacion_id) planificacion_id FROM mydb.planificacion";
    let consulta_id = await conexion.query(string_sql_id_max_planificacion);
    let id = consulta_id[0].planificacion_id
    
    let string_sql_planificacion = 
    `SELECT planificacion.planificacion_id, planificacion.month mes, planificacion.year a??o, 
    dia.dia_id, dia.dia_semana, dia.dia_numero, dia.comodin, 
    empleado.nombre, empleado.turno, empleado.empleado_id 
    FROM ${process.env.NOMBRE_BD}.planificacion planificacion, ${process.env.NOMBRE_BD}.empleado empleado,${process.env.NOMBRE_BD}.dia dia 
    WHERE planificacion.planificacion_id = ${id} and dia.planificacion_id = ${id}
    and dia.dia_id = empleado.dia_id
    ORDER BY dia.dia_id ASC`;
    let consulta_planificacion = await conexion.query(string_sql_planificacion);
    
    let string_sql_itinerario =
    `SELECT itinerario.turno, itinerario.empleado_faltante, dia.dia_id
    FROM ${process.env.NOMBRE_BD}.itinerario itinerario, ${process.env.NOMBRE_BD}.dia dia, ${process.env.NOMBRE_BD}.planificacion planificacion
    WHERE dia.dia_id = itinerario.dia_id 
    AND  dia.planificacion_id = planificacion.planificacion_id 
    AND planificacion.planificacion_id = ${id};
    `
    let consulta_itinerario = await conexion.query(string_sql_itinerario);

    let array_itinerario = new Array()
    
    for(k=0;k<consulta_itinerario.length;k++){
        dic_itinerario={}
        dic_itinerario.turno_itinerario = consulta_itinerario[k].turno;
        dic_itinerario.empleado_faltante = consulta_itinerario[k].empleado_faltante;
        dic_itinerario.dia_id = consulta_itinerario[k].dia_id;
        array_itinerario.push(dic_itinerario);
    }
    let json={}
    let array_dia = new Array();
    for(i=0;i<consulta_planificacion.length; i=i+5){
        if(i==0){
            json.planificacion_id = consulta_planificacion[0].planificacion_id 
            json.mes = consulta_planificacion[0].mes 
            json.anio = consulta_planificacion[0].a??o 
        }
        let mini_json={}
        let array_empleados = new Array();
        
        mini_json.dia_semana = consulta_planificacion[i].dia_semana
        mini_json.numero_dia = consulta_planificacion[i].dia_numero
        
        let indice = 0
        for(j=i;indice<5;j++){
            let empleado = {}
            empleado.nombre = consulta_planificacion[j].nombre
            empleado.turno = consulta_planificacion[j].turno
            array_empleados.push(empleado)
            indice++;
        }
        mini_json.empleados = array_empleados
        let array_new_itinerario = new Array()
        
        for(let h = 0; h<array_itinerario.length ;h++){
            if(array_itinerario[h].dia_id == consulta_planificacion[i].dia_id){
                let dic_itinerario = {}
                dic_itinerario.turno_itinerario = array_itinerario[h].turno_itinerario
                dic_itinerario.falta = array_itinerario[h].empleado_faltante
                array_new_itinerario.push(dic_itinerario)
            }
        }
        mini_json.itinerario = array_new_itinerario
        mini_json.comodin = consulta_planificacion[i].comodin
        array_dia.push(mini_json)
    }

    let string_sql_actualizacion = 
    `SELECT actualizacion.actualizacion_id, actualizacion.tipo_permiso,
    actualizacion.descripcion, actualizacion.empleado, 
    DATE_FORMAT(actualizacion.fecha, '%Y-%m-%d') fecha, 
    actualizacion.planificacion_id
    FROM ${process.env.NOMBRE_BD}.planificacion planificacion, ${process.env.NOMBRE_BD}.actualizacion actualizacion
    where ${process.env.NOMBRE_BD}.planificacion.planificacion_id = ${process.env.NOMBRE_BD}.actualizacion.planificacion_id and ${process.env.NOMBRE_BD}.planificacion.planificacion_id = ${id};
    `
    let consulta_actualizacion = await conexion.query(string_sql_actualizacion)
    json.actualizacion = consulta_actualizacion
    json.planificacion = array_dia;

    return json;
};

const eliminar = async(planificacion_id)=>{
    let string_sql = 
    `
    SELECT * FROM ${process.env.NOMBRE_BD}.dia 
    where planificacion_id = ${planificacion_id};
    `
    let consultaDias = await conexion.query(string_sql);
    
    for(let i=0;i<consultaDias.length;i++){
        let string_sql_itinerario = 
        `DELETE FROM ${process.env.NOMBRE_BD}.empleado 
        where dia_id = ${consultaDias[i].dia_id};
        `
        let consultaItinerario = await conexion.query(string_sql_itinerario);
        

        let string_sql_empleado = 
        `DELETE FROM ${process.env.NOMBRE_BD}.itinerario 
        where dia_id = ${consultaDias[i].dia_id};
        `
        let consultaEmpleado = await conexion.query(string_sql_empleado);
    }
    let string_sql_dia = 
    `DELETE FROM ${process.env.NOMBRE_BD}.dia 
    where planificacion_id = ${planificacion_id};`
    let delete_dia = await conexion.query(string_sql_dia);

    let string_sql_actualizacion = 
    `DELETE FROM ${process.env.NOMBRE_BD}.actualizacion 
    where planificacion_id = ${planificacion_id};`
    let delete_actualizacion = await conexion.query(string_sql_actualizacion);

    let string_sql_planificacion =
    `DELETE FROM ${process.env.NOMBRE_BD}.planificacion 
    where planificacion_id = ${planificacion_id};`
    let delete_planificacion = await conexion.query(string_sql_planificacion);
    return delete_planificacion;
};

module.exports.planificacionModel = {
    asignar_turno_empleado,
    guardar,
    eliminar,
    mostrar_ultima,
    ultimo_empleado_planificacion_anterior,
    mostrar_planificacion_anual,
    existe_planificacion,
    asignar_nombre_ultima_semana,
    existe_mes_anterior
};