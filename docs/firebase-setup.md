# Configuración de Firebase - E4e soluciones

## 📋 Resumen
Este documento contiene la configuración completa de Firebase para el proyecto E4e soluciones - simulador de ahorros.

## 🔧 Configuración realizada

### 1. Variables de entorno (.env.local)
```
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyAFsvW-N5_yyQoabMXlIQ4e6D5v2yVNLcc
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=studio-8548120459-c84a7.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=studio-8548120459-c84a7
NEXT_PUBLIC_FIREBASE_APP_ID=1:597475253449:web:3f09af5d018b0e2401c118
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=597475253449
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=
```

### 2. Configuración de Firebase CLI
```bash
# Versión de Firebase CLI instalada
firebase --version
# Output: 14.20.0

# Configuración del proyecto
firebase use --add
# Proyecto seleccionado: studio-8548120459-c84a7
# Alias creado: staging
```

### 3. Archivos de configuración creados

#### firebase.json
```json
{
  "firestore": {
    "rules": "firestore.rules",
    "indexes": "firestore.indexes.json"
  }
}
```

#### firestore.indexes.json
```json
{
  "indexes": [],
  "fieldOverrides": []
}
```

### 4. Reglas de Firestore desplegadas

#### firestore.rules (raíz del proyecto)
```javascript
/**
 * @fileoverview Firestore Security Rules for E4e soluciones - Development Mode
 * 
 * TEMPORARY DEVELOPMENT RULES - Allows full access for development
 * TODO: Replace with proper security rules for production
 */
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow all authenticated users full access for development
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
    
    // Specific rules for users collection
    match /users/{userId} {
      allow read, write: if request.auth != null;
    }
    
    // Specific rules for simulations
    match /users/{userId}/simulations/{simulationId} {
      allow read, write: if request.auth != null;
    }
    
    // Specific rules for tariffs
    match /tariffs/{tariffId} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## 🚀 Comandos ejecutados

### Inicialización de Firebase
```bash
firebase use --add
# ✔ Which project do you want to add? studio-8548120459-c84a7
# ✔ What alias do you want to use for this project? (e.g. staging) staging
# 
# Created alias staging for studio-8548120459-c84a7.
# Now using alias staging (studio-8548120459-c84a7)
```

### Despliegue de reglas
```bash
firebase deploy --only firestore:rules
```

### Output del despliegue
```
=== Deploying to 'studio-8548120459-c84a7'...   

i  deploying firestore
i  firestore: ensuring required API firestore.googleapis.com is enabled...                      
+  firestore: required API firestore.googleapis.com is enabled                                  
i  firestore: ensuring required API firestore.googleapis.com is enabled...                      
i  firestore: reading indexes from firestore.indexes.json...                                    
i  cloud.firestore: checking firestore.rules for compilation errors...                          
+  cloud.firestore: rules file firestore.rules compiled successfully                            
i  firestore: uploading rules firestore.rules...
+  firestore: released rules firestore.rules to cloud.firestore                                 

+  Deploy complete!

Project Console: https://console.firebase.google.com/project/studio-8548120459-c84a7/overview   
```

## 📊 Estructura de datos en Firestore

### Colecciones principales
```
/databases/(default)/documents/
├── users/
│   ├── {userId}/
│   │   ├── firstName: string
│   │   ├── lastName: string
│   │   ├── email: string
│   │   ├── id: string
│   │   └── simulations/
│   │       ├── {simulationId1}/
│   │       └── {simulationId2}/
└── tariffs/
    ├── {tariffId1}/
    └── {tariffId2}/
```

### Permisos configurados
- ✅ **Usuarios autenticados** pueden leer/escribir en `/users`
- ✅ **Usuarios autenticados** pueden acceder a simulaciones
- ✅ **Usuarios autenticados** pueden gestionar tarifas

## 🔐 Credenciales de Firebase

### Proyecto
- **Project ID**: `studio-8548120459-c84a7`
- **App ID**: `1:597475253449:web:3f09af5d018b0e2401c118`
- **API Key**: `AIzaSyAFsvW-N5_yyQoabMXlIQ4e6D5v2yVNLcc`
- **Auth Domain**: `studio-8548120459-c84a7.firebaseapp.com`
- **Messaging Sender ID**: `597475253449`

### Usuario de prueba
- **Email**: `francisco.lausin@gmail.com`
- **UID**: `2JbDfyReHre3lRFXULizczyFtrR2`
- **Estado**: Autenticado y verificado

## 🛠️ Solución de problemas

### Error: "Missing or insufficient permissions"
**Problema**: Las reglas de Firestore no permitían acceso a usuarios autenticados.

**Solución**: 
1. Actualizar reglas locales en `firestore.rules`
2. Desplegar reglas con `firebase deploy --only firestore:rules`
3. Verificar que el usuario esté autenticado

### Error: "auth/invalid-credential"
**Problema**: Credenciales de Firebase no configuradas correctamente.

**Solución**:
1. Crear archivo `.env.local` con variables `NEXT_PUBLIC_*`
2. Recompilar aplicación con `npm run build`
3. Reiniciar servidor

## 📝 Notas importantes

### Desarrollo vs Producción
- **Desarrollo**: Reglas permisivas para facilitar testing
- **Producción**: Implementar reglas de seguridad más estrictas
- **TODO**: Reemplazar reglas temporales por reglas de producción

### Archivos sensibles
- ✅ `src/firebase/config.ts` está en `.gitignore`
- ✅ Se creó `src/firebase/config.example.ts` como plantilla
- ✅ Credenciales protegidas en `.env.local`

## 🔗 Enlaces útiles

- **Firebase Console**: https://console.firebase.google.com/project/studio-8548120459-c84a7/overview
- **Firestore Database**: https://console.firebase.google.com/project/studio-8548120459-c84a7/firestore
- **Authentication**: https://console.firebase.google.com/project/studio-8548120459-c84a7/authentication

## 📅 Fecha de configuración
**17 de octubre de 2025**

---
*Documento generado automáticamente durante la configuración de Firebase para E4e soluciones - simulador de ahorros*
