"""
state.py -- Estado global en memoria del Sistema POS
=====================================================
Centraliza variables que viven solo mientras el servidor esta corriendo.
Importar desde cualquier blueprint con:

    from state import mesas_activas
    from state import configuracion_sistema

REGLA: solo MUTAR los dicts (mesas_activas[key] = ..., del mesas_activas[key]).
       Nunca reasignar (mesas_activas = {} romperia la referencia compartida).
"""

# Comandas activas en el piso: { numero_mesa (str): dict con datos de la mesa }
mesas_activas = {}

# Configuracion general del negocio (editable desde la vista Configuracion)
configuracion_sistema = {
    "empresa":      "Cafeteria UAEMex",
    "direccion":    "Cerro de Coatepec S/N, Toluca",
    "moneda":       "MXN ($)",
    "iva":          "16%",
    "limite_mesas": 6,
    "version":      "v1.0-Stable",
}
