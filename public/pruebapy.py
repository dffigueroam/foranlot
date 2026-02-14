def mayor_lista_digita():
    cant = int(input("¿Cuántos números quieres comparar?: "))
    
    if cant>0: lista = []
    else: print("no digitaste un numero valida"), exit()
        
    for num in range(cant):
        numero = int(input(f"Ingrese el número {num+1}: "))
        lista.append(numero)
    
    max = lista[0]
    
    for n in lista:
        if n > max:
            max = n
    return "El max número digitado es", max

print(mayor_lista_digita())