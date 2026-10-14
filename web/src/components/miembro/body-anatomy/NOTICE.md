# Aviso de origen

El código de este directorio (`web/src/components/miembro/body-anatomy/`) es
una adaptación, incorporada directamente al código fuente de GymPro, de la
librería **react-muscle-highlighter** de Shehryar Sorooj
(https://github.com/soroojshehryar/react-muscle-highlighter), licencia MIT.

Se simplificó a solo el modelo masculino (`Body.jsx` sin el prop `gender`,
sin `SvgFemaleWrapper` ni los assets femeninos) porque GymPro no registra el
género del socio todavía; si se agrega ese dato, el componente original
soporta ambos y puede volver a vendorizarse completo.

Se conserva este aviso por requisito de la licencia MIT (reproducir el aviso
de copyright original). El repositorio original fue marcado con estrella en
la cuenta del proyecto para reconocerlo en la documentación del proyecto.

```
MIT License

Copyright (c) 2024 Shehryar Sorooj

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```
