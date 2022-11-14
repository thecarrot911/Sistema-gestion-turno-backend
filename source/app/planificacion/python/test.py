from sklearn.utils import shuffle
import sys
import random
from calendar import monthrange
from ortools.sat.python import cp_model

class SolutionPrinter(cp_model.CpSolverSolutionCallback):
    """Clase para imprimir la solución."""

    def __init__(self,solution_number,mes,cont_semana,all_empleado,all_dias,cant_turno,solution_limit):
        cp_model.CpSolverSolutionCallback.__init__(self)
        self._solution_number = solution_number
        self._mes = mes
        self._cont_semana = cont_semana
        self._all_empleado = all_empleado
        self._all_dias = all_dias
        self._all_turno = cant_turno
        self._solution_count = 0
        self._solution_limit = solution_limit

    def on_solution_callback(self):
        self._solution_count += 1
        if(self._solution_count == self._solution_number):
            print("SOLUCIÓN N°%i" % self._solution_count)
            indice = 0
            # AGREGAR CONTADORES 
            for num_semana in range(len(self._cont_semana)):
                print("Semana %i"% (indice+1))
                print("_____________________________")
                for i in range(self._cont_semana[indice]):
                    print("[%s]  Día n° %i - %s" % (self._mes[num_semana][i][0],self._mes[num_semana][i][1],self._mes[num_semana][i][2]))
                    #if(self._mes[num_semana][i][1]=="Domingo"):
                    for j in all_empleado:
                        is_working = False
                        for t in range(cant_turno):
                            if(self.Value(self._mes[num_semana][i][3][j][t])):
                                is_working = True
                                print('Empleado %i trabaja en el turno %i' % ((j+1), (t+1)))
                        if not is_working:
                            print('Empleado {} no trabaja en el turno'.format(j+1))
                print("_____________________________")
                indice = indice + 1
        if self._solution_count >= self._solution_limit:
            self.StopSearch()
    
    def solution_count(self):
        return self._solution_count

year = int(sys.argv[1]) 
month = int(sys.argv[2])
num_empleado = int(sys.argv[3])

if(month==12):
    month_next = 1
    year_next = year+1
    year_prev = year
    month_prev = month-1
elif(month==1):
    month_prev = 12
    year_prev = year-1
    year_next = year
    month_next = month+1
else:
    year_prev = year
    month_prev = month-1
    year_next = year
    month_next = month+1

dias_mes_prev = monthrange(year_prev, month_prev)
dias_mes_actual  = monthrange(year,month)
dias_mes_next = monthrange(year_next, month_next)

indice_semana_prev = dias_mes_prev[0]
cantidad_dias_prev = dias_mes_prev[1]

indice_semana = dias_mes_actual[0]
cantidad_dias = dias_mes_actual[1]

indice_semana_next = dias_mes_next[0]
cantidad_dias_next = dias_mes_next[1]

meses_anio = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre", "Diciembre"]
dias_semana = ["Lunes","Martes","Miércoles","Jueves","Viernes","Sábado","Domingo"]
cant_turno = 3 

all_empleado = range(num_empleado) # 0..3
all_dias = range(1,cantidad_dias+1) # 1..cantidade_dias+1 #TODO: CAMBIAR PARA SIGUIENTES DÍAS DEL MES

# Modelo
model = cp_model.CpModel()

# Creación de las variables
mes = []
semana = []

def empleado_turno():
    array_empleado = []
    for empleado in all_empleado:
        turnos = []
        for t in range(cant_turno):
            turnos.append(
                model.NewBoolVar('Empleado n° %i con turno n°%i' % (empleado,(t+1)))
            )
        array_empleado.append(turnos)
    return array_empleado

for dia in all_dias:
    if(dias_semana[indice_semana] == "Lunes" and dia != 1):
        mes.append(semana)
        semana = []
        array_empleado = empleado_turno()
        if(dia == cantidad_dias): 
            semana.append([meses_anio[month-1],dia, dias_semana[indice_semana], array_empleado])
            mes.append(semana)
        else: 
            semana.append([meses_anio[month-1],dia, dias_semana[indice_semana], array_empleado])
    else: 
        array_empleado = empleado_turno()
        if(dia == cantidad_dias):
            semana.append([meses_anio[month-1],dia, dias_semana[indice_semana], array_empleado])
            mes.append(semana)
        else:
            semana.append([meses_anio[month-1],dia, dias_semana[indice_semana], array_empleado])
    indice_semana = indice_semana + 1
    if(indice_semana == 7): indice_semana=0

# Condición para agregar los dias faltantes de la última semana del mes
if(len(mes[len(mes)-1])!=7):
    indice_semana = dias_mes_actual[0]
    for k in range(7-indice_semana_next):
        array_empleado = empleado_turno()
        mes[len(mes)-1].insert(indice_semana_next,[meses_anio[month_next-1],k+1,dias_semana[indice_semana_next],array_empleado])
        indice_semana_next = indice_semana_next + 1
# Condición para gregar los dias faltantes de la primera semana del mes
if(len(mes[0])!=7):
    indice_semana = dias_mes_actual[0]
    for j in range(indice_semana):
        array_empleado = empleado_turno()
        mes[0].insert(0,[meses_anio[month_prev-1],cantidad_dias_prev,dias_semana[indice_semana-1],array_empleado])
        cantidad_dias_prev = cantidad_dias_prev-1
        indice_semana = indice_semana-1

# For para contar la cantidad de semanas
cont_semana = []
for i in mes:
    cont_semana.append(len(i))
indice = 0

"""for num_semana in range(len(cont_semana)):
    print("-------------------------")
    print("semana n° %i" % (num_semana+1))
    print("-------------------------")
    for i in range(cont_semana[indice]):
        print("%s %i %s" % (mes[num_semana][i][0],mes[num_semana][i][1],mes[num_semana][i][2]))
    indice = indice + 1"""

#Restricciones
#mes[num_semana][i][0] -> Mes
#mes[num_semana][i][1] -> Dia del mes
#mes[num_semana][i][2] -> Dia de semana
#mes[num_semana][i][3] -> Array de Empleado

# Cada empleado trabaja como máximo un turno por día. (Puede ser 0 porque puede tener el día libre al ser solo 3 turnos)
for e in all_empleado:
    indice = 0
    for num_semana in range(len(cont_semana)):
        for i in range(cont_semana[indice]):
            model.AddAtMostOne(mes[num_semana][i][3][e][t] for t in range(cant_turno))
        indice = indice + 1

# Cada empleado tiene 1 día libre por semana [AGREGAR LO DE BD]
for e in all_empleado:
    indice = 0
    for num_semana in range(len(cont_semana)):
        lista_semana = []
        if(cont_semana[num_semana]==7):
            for i in range(cont_semana[indice]):
                if mes[num_semana][i][2] != 'Domingo':
                    for t in range(cant_turno):
                        lista_semana.append(mes[num_semana][i][3][e][t])
            model.Add(sum(lista_semana) == 5)
        indice = indice + 1

# Los empleados tienen 2 domingos libres durante el mes 
domingos = []
indice = 0
for num_semana in range(len(cont_semana)):
    for i in range(cont_semana[indice]):
        if mes[num_semana][i][2] == 'Domingo' and mes[num_semana][i][0] == meses_anio[month-1]: 
            domingos.append([i, num_semana]) 
    indice = indice + 1

if(len(domingos)==5):
    for e in all_empleado: 
        lista_domingo_suma = []
        for domingo, num_semana in domingos:
            for t in range(cant_turno):
                lista_domingo_suma.append(mes[num_semana][domingo][3][e][t])
        model.Add(sum(lista_domingo_suma) == len(domingos) - 2)  
else:
    for e in all_empleado: 
        lista_domingo_suma = []
        for domingo, num_semana in domingos:
            for t in range(cant_turno):
                lista_domingo_suma.append(mes[num_semana][domingo][3][e][t])
        model.Add(sum(lista_domingo_suma) == len(domingos) - 2) 

# Restricción de Itinerario
# 5 DOMINGOS - 1 EMPLEADO PARA CADA TURNO. (3 EMPLEADO TRABAJANDO MÁXIMO)
# 4 DOMINGOS - 1 TURNO SIN OCUPAR. (2 EMPLEADO TRABAJANDO MÁXIMO)
# POR AHORA NOS E CONSDIERA 2 CHOQUES DE VUELO EN UN MISMO DIA :'V
#TURNOS:
#Turno 1: 07:00 – 15:00
#Turno 2: 15:00 – 23:00
#Turno 3: 23:00 – 07:00
            #dia,turno,empleado
itinerario=[[3,2,2],
            [8,1,2],
            [11,2,3],
            [18,2,2],
            [25,2,2]]
# SI HAY OTRO CHOQUE QUE MANDE ARREGLO IGUAL

def ItinerarioFunction(dia,itinerario):
    for i in range(len(itinerario)):
        #print("%i|%i" % (d,itinerario[i][0]))
        if(itinerario[i][0]==dia):
            return i
    return None

lista_alarma_turno = []
lista_domingos_four_week = [[1,1,0],[1,1,0],[1,1,1],[1,1,1]]

dias_libre_semana = num_empleado
turnos_extra = 6*num_empleado-dias_libre_semana-6*cant_turno # 30-5-18 = 23 empleados

lista_domingos_four_week[0] = shuffle(lista_domingos_four_week[0])
lista_domingos_four_week[1] = shuffle(lista_domingos_four_week[1])
lista_domingos_four_week = shuffle(lista_domingos_four_week)

list_itinerario = []
indice = 0
for num_semana in range(len(cont_semana)):
    semana_work=[]
    work_extra = turnos_extra
    for i in range(cont_semana[indice]):
        dia_work = []
        index_itinerario = ItinerarioFunction(mes[num_semana][i][1],itinerario) 
        if(i!=6):
            if(index_itinerario != None):
                if((itinerario[index_itinerario][2]+cant_turno-1<=5) and (work_extra>= itinerario[index_itinerario][2])):
                    work_extra = work_extra+1 - itinerario[index_itinerario][2]
                    for t in range(cant_turno):
                        if(itinerario[index_itinerario][1]==(t+1)):
                            dia_work.append(itinerario[index_itinerario][2])
                        else:
                            dia_work.append(1)
                    semana_work.append(dia_work)
                else:
                    semana_work.append([1,1,1])
            else:
                semana_work.append([1,1,1])
    if(work_extra>=1):
        for w_e in range(len(semana_work)):
            if((work_extra-1>=0) and (semana_work[w_e][0]==1)):
                semana_work[w_e][0]=semana_work[w_e][0]+1
                work_extra = work_extra-1
            elif(work_extra-1>=0):
                work_extra = work_extra
            else:
                break
        if(work_extra-1==0): 
            dia_random = random.randint(0,len(semana_work)-1)
            semana_work[dia_random][1]=semana_work[dia_random][1]+1
            work_extra = work_extra-1
    list_itinerario.append(semana_work)
    indice = indice + 1

indice = 0
for num_semana in range(len(cont_semana)):
    for i in range(cont_semana[indice]):
        if(len(domingos)==5): # 5 DOMINGOS
            if(mes[num_semana][i][2]=="Domingo" and mes[num_semana][i][0] == meses_anio[month-1]):
                index_itinerario = ItinerarioFunction(mes[num_semana][i][1])
                turno_dia = []
                if(index_itinerario != None): # Dias CON itinerario
                    for t in range(cant_turno): # FOR DE TURNOS
                        if(itinerario[index_itinerario][1]== t+1):
                            turno_dia.append(
                                model.NewIntVar(itinerario[index_itinerario][2], itinerario[index_itinerario][2],'turno %i' % (t+1))
                            )
                        else:
                            turno_dia.append(
                                model.NewIntVar(1,num_empleado-itinerario[index_itinerario][2],'turno %i' % (t+1))
                            )
                    model.Add(turno_dia[0] + turno_dia[1] + turno_dia[2] == num_empleado) # x+y+z=5
                else: # DIAS SIN  ITINERARIO
                    model.Add(sum(mes[num_semana][i][3][e][0] for e in all_empleado)>=1)
                    model.Add(sum(mes[num_semana][i][3][e][1] for e in all_empleado)>=1)
                    model.Add(sum(mes[num_semana][i][3][e][2] for e in all_empleado)>=1)
            else: # SI NO ES DOMINGO -- FALTA IF Y ELSE DE ITINERARIO
                model.Add(sum(mes[num_semana][i][3][e][0] for e in all_empleado)>=2)
                model.Add(sum(mes[num_semana][i][3][e][1] for e in all_empleado)>=1)
                model.Add(sum(mes[num_semana][i][3][e][2] for e in all_empleado)>=1)
        else: # 4 DOMINGOS
            # DOS TRABAJADORES
            if(mes[num_semana][i][2]=="Domingo" and mes[num_semana][i][0] == meses_anio[month-1]): #Domingo y mes actual
                print("no alcanza nunca xd")
                if(index_itinerario != None): # ITINERARIO
                    model.Add(sum(mes[num_semana][i][3][e][0] for e in all_empleado)>=lista_domingos_four_week[num_semana][0])
                    model.Add(sum(mes[num_semana][i][3][e][1] for e in all_empleado)>=lista_domingos_four_week[num_semana][1])
                    model.Add(sum(mes[num_semana][i][3][e][2] for e in all_empleado)>=lista_domingos_four_week[num_semana][2])
                else: # NO ITINERARIO
                    model.Add(sum(mes[num_semana][i][3][e][0] for e in all_empleado)>=lista_domingos_four_week[num_semana][0])
                    model.Add(sum(mes[num_semana][i][3][e][1] for e in all_empleado)>=lista_domingos_four_week[num_semana][1])
                    model.Add(sum(mes[num_semana][i][3][e][2] for e in all_empleado)>=lista_domingos_four_week[num_semana][2])
            elif(mes[num_semana][i][2]=="Domingo" and mes[num_semana][i][0] != meses_anio[month-1]): #Domingo y otro mes
                print("NO CONSIDERAR XD|asignacion normal %i" % mes[num_semana][i][1])
                model.Add(sum(mes[num_semana][i][3][e][0] for e in all_empleado)>=0)
                model.Add(sum(mes[num_semana][i][3][e][1] for e in all_empleado)>=0)
                model.Add(sum(mes[num_semana][i][3][e][2] for e in all_empleado)>=0)
            else: #NO ES DOMINGO .                
                print("%i %i %i"% (list_itinerario[num_semana][i][0],list_itinerario[num_semana][i][1],list_itinerario[num_semana][i][2]))

                model.Add(sum(mes[num_semana][i][3][e][0] for e in all_empleado)>=list_itinerario[num_semana][i][0])
                model.Add(sum(mes[num_semana][i][3][e][1] for e in all_empleado)>=list_itinerario[num_semana][i][1])
                model.Add(sum(mes[num_semana][i][3][e][2] for e in all_empleado)>=list_itinerario[num_semana][i][2])
    indice = indice + 1


# Cada turno es asignado a solo un empleado por día.
# (Esta restricción debe depender según la cantidad de aviones que llegue a ese turno con al menos una diferencia de 20 minutos.)
"""indice = 0
list_four_mana = [[1,1,0],[1,1,0],[1,1,1],[1,1,1]]
list_four_mana[0] = shuffle(list_four_mana[0])
list_four_mana[1] = shuffle(list_four_mana[1])
list_four_mana = shuffle(list_four_mana)


for num_semana in range(len(cont_semana)):
    for i in range(cont_semana[indice]):
        if(len(domingos)==5): # 5 DOMINGOS
            if(mes[num_semana][i][2]=="Domingo" and mes[num_semana][i][0] == meses_anio[month-1]):
                model.Add(sum(mes[num_semana][i][3][e][0] for e in all_empleado)>=1)
                model.Add(sum(mes[num_semana][i][3][e][1] for e in all_empleado)>=1)
                model.Add(sum(mes[num_semana][i][3][e][2] for e in all_empleado)>=1)
            else:
                model.Add(sum(mes[num_semana][i][3][e][0] for e in all_empleado)>=2)
                model.Add(sum(mes[num_semana][i][3][e][1] for e in all_empleado)>=1)
                model.Add(sum(mes[num_semana][i][3][e][2] for e in all_empleado)>=1)
        else: # 4 DOMINGOS - ASIGNA LOS VALORES DE LIST FOUR PARA QUE HAYA COMO MÍNIMO 2 TRABAJADORES
            if(mes[num_semana][i][2]=="Domingo" and mes[num_semana][i][0] == meses_anio[month-1]):
                model.Add(sum(mes[num_semana][i][3][e][0] for e in all_empleado)>=list_four_mana[num_semana][0])
                model.Add(sum(mes[num_semana][i][3][e][1] for e in all_empleado)>=list_four_mana[num_semana][1])
                model.Add(sum(mes[num_semana][i][3][e][2] for e in all_empleado)>=list_four_mana[num_semana][2])
            else:
                model.Add(sum(mes[num_semana][i][3][e][0] for e in all_empleado)>=2)
                model.Add(sum(mes[num_semana][i][3][e][1] for e in all_empleado)>=1)
                model.Add(sum(mes[num_semana][i][3][e][2] for e in all_empleado)>=1)
    indice = indice + 1"""

# Las personas no pueden tener 2 turnos seguidos 
for e in all_empleado:
    indice = 0
    for num_semana in range(len(cont_semana)):
        for i in range(cont_semana[indice]):
            lista_turno = []
            if(i+1!=cont_semana[indice]):
                lista_turno.append(mes[num_semana][i][3][e][2])
                lista_turno.append(mes[num_semana][i+1][3][e][0])
                model.Add(sum(lista_turno) <= 1)
        indice = indice + 1

# Crea el solver y la solución
solver = cp_model.CpSolver()
solver.parameters.linearization_level = 0

# Enumera todas las soluciones encontradas
solver.parameters.enumerate_all_solutions = True
solution_limit = 100
solution_number = random.randint(1,solution_limit)
solution_printer = SolutionPrinter(solution_number,mes,cont_semana,all_empleado,all_dias,cant_turno,solution_limit)
solver.Solve(model, solution_printer)
# Statistics.
print('\nStatistics')
print('  - conflicts      : %i' % solver.NumConflicts())
print('  - branches       : %i' % solver.NumBranches())
print('  - wall time      : %f s' % solver.WallTime())
print('  - solutions found: %i' % solution_printer.solution_count())

#CREAR ITINERARIO Y VER COMO HACER QUE HAGA MÁS TURNOS PARA EL ITINERARIO 
# O REALIZAR LA ALERTA DE ALGUNA MANERA.....
# CREAR DENUEVO LA BASE DE DATOS PARA GUARDAR PLANIFICACIONES,
