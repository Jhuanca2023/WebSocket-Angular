# WebRocket - Sistema de Chat Premium (Frontend)

WebRocket es una plataforma de chat profesional diseñada con Angular, enfocada en ofrecer una experiencia de usuario premium con estética vanguardista, modo oscuro/claro dinámico y comunicación en tiempo real.

## ✨ Características Premium

- **Interfaz Vanguardista**: Diseño basado en Glassmorphism y manchas brillantes (glowing blobs).
- **Modo Oscuro/Claro**: Sistema de temas persistente y profesional sin emojis.
- **Comunicación en Tiempo Real**: Integración completa con Socket.IO.
- **Autenticación**: Login y Registro con Layout dividido (Style ICENTER).
- **Gestión de Salas**: Salas de chat dinámicas con lista de mensajes en vivo.

## 🚀 Tecnologías

- **Angular 19**: Framework principal.
- **TypeScript**: Programación tipada.
- **Tailwind CSS v4**: Estilos modernos y utilitarios.
- **Socket.IO Client**: Conexión bidireccional con el servidor.

## 📦 Instalación y Setup

1. **Clonar este repositorio**:
   ```bash
   git clone https://github.com/Jhuanca2023/WebSocket-Angular.git
   ```

2. **Clonar y configurar el Backend**:
   Es **obligatorio** tener el servidor corriendo. Sigue las instrucciones aquí: [WebSockets-Node.js](https://github.com/Jhuanca2023/WebSockets-Node.js)

3. **Instalar dependencias del Frontend**:
   ```bash
   npm install
   ```

4. **Ejecutar en modo desarrollo**:
   ```bash
   ng serve
   ```
   La aplicación estará disponible en `http://localhost:4200`.

## 🛠️ Estructura del Proyecto
- `src/app/core/`: Servicios globales, guardias y modelos.
- `src/app/features/`: Módulos de funcionalidades (Login, Register, Chat, Landing).
- `src/app/shared/`: Componentes y componentes compartidos.
- `src/styles.css`: Definición del sistema de diseño (Colores, Blobs, Temas).

## 🔒 Requisitos del Backend
Asegúrate de que la URL del backend en `src/app/core/services/chat.service.ts` y otros servicios apunte correctamente a tu servidor local (por defecto `http://localhost:3000`).

---
Desarrollado con pasión para el futuro de la comunicación por [Jhuanca2023](https://github.com/Jhuanca2023).
