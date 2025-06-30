
function irAPantalla(num) {
    document.querySelectorAll('.pantalla').forEach(p => p.classList.add('oculto'));
    document.getElementById('pantalla' + num).classList.remove('oculto');
}

function simularGrabacion() {
    irAPantalla(3);
    setTimeout(() => {
        document.querySelector('#pantalla3 h2').innerText = 'Transcripción completada';
    }, 2000);
}

function mostrarResumen() {
    document.getElementById('resumen').classList.remove('oculto');
}
