## Descripción

Los pequeños y medianos negocios de mantenimiento y reparación de computadores,
celulares y otros dispositivos tecnológicos suelen gestionar clientes, equipos y
Órdenes de forma dispersa: cuadernos, hojas de cálculo o herramientas aisladas.
Esto genera pérdida o duplicidad de información, dificultad para conocer el estado
de una reparación, confusión sobre los equipos que permanecen en el local y
Ausencia de un historial organizado de servicios.

Este proyecto es una plataforma web que centraliza la gestión y el seguimiento
de las órdenes de servicio técnico, desde la recepción del equipo hasta su entrega
y la consulta del historial. Permite registrar clientes, dispositivos y técnicos;
documentar fallas y diagnósticos; generar cotizaciones con aprobación o rechazo;
registrar servicios y repuestos utilizados; controlar el acceso mediante roles
(Administrador, Técnico y Cliente) y conservar un historial de las operaciones
relevantes.

Objetivo: desarrollar en un máximo de 11 semanas una plataforma funcional que
Mejore la organización, la trazabilidad y la eficiencia del proceso de
Servicio técnico.

> Proyecto académico (MVP) desarrollado para Proyecto Informático I,
> Universidad Autónoma de Occidente, Cali, 2026.


Capa	Tecnología
Frontend	React + Vite
Backend	Node.js + Express
Base de datos	mysql2
Autenticación	JWT + bcrypt
Control de versiones	Git + GitHub

Estructura del repositorio.
├── backend/       
├── database/  
├── .gitignore
└── README.md


Rama	Propósito	Reglas
main	Versión estable / demostrable	Solo recibe merges desde develop vía Pull Request. Nunca se hace push directo.
develop	Integración del trabajo en curso	Recibe las ramas de trabajo vía Pull Request.
feature/<nombre>	Nueva funcionalidad	Sale de develop, vuelve a develop.
fix/<nombre>	Corrección de errores	Sale de develop, vuelve a develop.
docs/<nombre>	Documentación	Sale de develop, vuelve a develop.
hotfix/<nombre>	Error urgente en main	Sale de main, vuelve a main y a develop.

Flujo de trabajo
Actualizar develop: git checkout develop && git pull origin develop
Crear rama de trabajo: git checkout -b feature/gestion-clientes
Hacer commits pequeños siguiendo la convención.
Subir la rama: git push -u origin feature/gestion-clientes
Abrir un Pull Request hacia develop, con al menos 1 revisión de otro integrante.
Resolver conflictos en local (git merge develop dentro de tu rama) antes de aprobar.

Equipo
Juan Miguel Perdomo Muñoz
Juan Camilo Gonzales Rodas
José David Aguirre
Gabriel Armando Gil


