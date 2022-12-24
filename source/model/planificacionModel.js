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

    /*let string_sql_empleado = 
    `SELECT empleado.nombre 
    FROM ${process.env.NOMBRE_BD}.empleado empleado
    WHERE empleado.dia_id = ${consulta_ultimo_dia[0].dia_id} and turno='23:00 a 07:00';
    `*/
    consulta_empleado_ultimo_dia = await conexion.query(string_sql_empleado)
    return consulta_empleado_ultimo_dia
}

const dias_mes_anterior = async(anio,numero_mes)=>{
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

const asignar_turno_empleado = async(planificacion, empleados, indice,ultimo_empleado)=>{
    let turno = ['"Libre"','"07:00 a 15:00"','"15:00 a 23:00"','"23:00 a 07:00"'];
    let array_empleados = new Array();
    let array_ultimoTurno = new Array()
    
    
    for(let x=0;x<empleados.length;x++){
        if(planificacion[indice].empleados[x].turno==3){
            array_ultimoTurno.push(x)
        }
    }
    console.log(planificacion[indice].empleados)
    console.log(array_ultimoTurno);

    for(let i=0;i<empleados.length;i++){
        for(let j=0;j<ultimo_empleado.length;j++){
            if(empleados[i].nombre == ultimo_empleado[0].nombre){

            }
            else{

            }
        }
    }

    /*for(let i = indice; i<planificacion.length ;i++){
        for(let k = 0; k<empleados.length ;k++){
            if(typeof(planificacion[i].empleados[k].nombre)!=Number && array_empleados[k] != ultimo_empleado[0].nombre && planificacion[i].empleados[k].turno != 3){
                planificacion[i].empleados[k].nombre = array_empleados[k].nombre
            }
            else{
                console.log(typeof(planificacion[i].empleados[k].nombre))
            }
        }
    }*/

    /*array_empleados = array_empleados.sort(function() {return Math.random() - 0.5});

    //Asignación de turno
    for (i = 1;i<=array_empleados.length;i++){
        obj = obj.replaceAll('"nombre": '+i,'"nombre": "'+array_empleados[i-1]+'"');
    }
    
    //Reemplazo de los numeros por horas
    for (i=0; i<=3;i++){
        obj = obj.replaceAll('"turno": '+i,'"turno": '+turno[i]);
        obj = obj.replaceAll('"comodin": '+i,'"comodin": '+turno[i])
        obj = obj.replaceAll('"turno_itinerario": '+i,'"turno_itinerario": '+turno[i]);
    }
    return obj;*/

};

const guardar = async(month, year, planificacion)=>{
    let meses_anio = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre", "Diciembre"]
    let mes = meses_anio[month-1]
    let string_sql = "INSERT INTO "+process.env.NOMBRE_BD+".planificacion(month, year) VALUES('"+mes+"','"+year+"');";
    
    //Inserción de la planificación
    let insert_planificacion = await conexion.query(string_sql);
    let planificacion_id = insert_planificacion.insertId;
    let dia_semana;
    let numero_dia;
    let comodin;

    // Inserción del día 
    for(i=0;i<planificacion.length;i++){
        dia_semana = planificacion[i].dia_semana
        numero_dia = planificacion[i].numero_dia
        comodin = planificacion[i].comodin
        let string_sql_dia = "INSERT INTO "+process.env.NOMBRE_BD+".dia(planificacion_id, dia_semana, dia_numero, comodin) VALUES('"+planificacion_id+"','"+dia_semana+"','"+numero_dia+"','"+comodin+"')";

        let insert_dia = await conexion.query(string_sql_dia);
        dia_id = insert_dia.insertId

        // Inserción de empleados
        for(j=0;j<planificacion[i].empleados.length;j++){
            let nombre = planificacion[i].empleados[j].nombre
            let turno = planificacion[i].empleados[j].turno
            let string_sql_empleado = "INSERT INTO "+process.env.NOMBRE_BD+".empleado(dia_id, nombre, turno) VALUES('"+dia_id+"','"+nombre+"','"+turno+"')";
            await conexion.query(string_sql_empleado);
        }
        // Inserción de itinerario
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
        `SELECT planificacion.planificacion_id, planificacion.month mes, planificacion.year año, 
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
                json.anio = consulta_planificacion[0].año 
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
            
            for(h=0;h<array_itinerario.length;h++){
                if(array_itinerario[h].dia_id != consulta_planificacion[i].dia_id){
                    control = 0;
                }else{
                    let dic_itinerario = {}
                    dic_itinerario.turno_itinerario = array_itinerario[h].turno_itinerario
                    dic_itinerario.falta = array_itinerario[h].empleado_faltante
                    array_new_itinerario.push(dic_itinerario)
                    control = 1;
                }
            }
            if(control == 0){
                mini_json.itinerario = []
            }else{
                mini_json.itinerario = array_new_itinerario
            }
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
    `SELECT planificacion.planificacion_id, planificacion.month mes, planificacion.year año, 
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
            json.anio = consulta_planificacion[0].año 
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
        
        for(h=0;h<array_itinerario.length;h++){
            if(array_itinerario[h].dia_id != consulta_planificacion[i].dia_id){
                control = 0;
            }else{
                let dic_itinerario = {}
                dic_itinerario.turno_itinerario = array_itinerario[h].turno_itinerario
                dic_itinerario.falta = array_itinerario[h].empleado_faltante
                array_new_itinerario.push(dic_itinerario)
                control = 1;
            }
        }
        if(control == 0){
            mini_json.itinerario = []
        }else{
            mini_json.itinerario = array_new_itinerario
        }
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

module.exports.planificacionModel = {
    asignar_turno_empleado,
    guardar,
    mostrar_ultima,
    ultimo_empleado_planificacion_anterior,
    mostrar_planificacion_anual,
    dias_mes_anterior
};