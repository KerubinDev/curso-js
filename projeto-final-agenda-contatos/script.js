// ===== SISTEMA DE RECADOS - JAVASCRIPT =====

// ===== FUNÇÃO DE LOADING DECORATIVA =====
function iniciarLoading() {
    // Simular carregamento de recursos
    setTimeout(() => {
        const loadingScreen = $('#loading-screen');
        loadingScreen.addClass('fade-out');
        
        setTimeout(() => {
            loadingScreen.hide();
            // Inicializar o sistema após o loading
            window.sistema = new SistemaRecados();
            
            // Efeito de entrada da página
            $('body').fadeIn(500);
            
            // Configurar tooltips do Bootstrap
            const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
            tooltipTriggerList.map(function (tooltipTriggerEl) {
                return new bootstrap.Tooltip(tooltipTriggerEl);
            });
        }, 500);
    }, 3000); // 3 segundos de loading decorativo
}

class SistemaRecados {
    constructor() {
        this.recados = [];
        this.ordenacaoCrescente = true;
        this.init();
    }

    // Inicialização do sistema
    init() {
        this.carregarRecados();
        this.configurarEventos();
        this.atualizarInterface();
        this.definirDataAtual();
    }

    // Configurar todos os eventos
    configurarEventos() {
        // Formulário de envio
        $('#form-recado').on('submit', (e) => {
            e.preventDefault();
            this.adicionarRecado();
        });

        // Botão limpar formulário
        $('#btn-limpar').on('click', () => {
            this.limparFormulario();
        });

        // Botão ordenar por data
        $('#btn-ordenar-data').on('click', () => {
            this.ordenarPorData();
        });

        // Botão limpar todos os recados
        $('#btn-limpar-todos').on('click', () => {
            this.limparTodosRecados();
        });

        // Validação em tempo real
        this.configurarValidacaoTempoReal();
    }

    // Configurar validação em tempo real
    configurarValidacaoTempoReal() {
        const campos = ['remetente', 'destinatario', 'dataHora', 'texto'];
        
        campos.forEach(campo => {
            $(`#${campo}`).on('input blur', () => {
                this.validarCampo(campo);
            });
        });
    }

    // Validar campo específico
    validarCampo(campo) {
        const elemento = $(`#${campo}`);
        const valor = elemento.val().trim();
        let valido = true;

        switch (campo) {
            case 'remetente':
            case 'destinatario':
                valido = valor.length >= 2;
                break;
            case 'dataHora':
                valido = valor !== '';
                break;
            case 'texto':
                valido = valor.length >= 10;
                break;
        }

        if (valido) {
            elemento.removeClass('is-invalid').addClass('is-valid');
        } else {
            elemento.removeClass('is-valid').addClass('is-invalid');
        }

        return valido;
    }

    // Validar formulário completo
    validarFormulario() {
        const campos = ['remetente', 'destinatario', 'dataHora', 'texto'];
        let formularioValido = true;

        campos.forEach(campo => {
            if (!this.validarCampo(campo)) {
                formularioValido = false;
            }
        });

        return formularioValido;
    }

    // Adicionar novo recado
    adicionarRecado() {
        if (!this.validarFormulario()) {
            this.mostrarNotificacao('Por favor, preencha todos os campos corretamente.', 'error');
            return;
        }

        const recado = {
            id: Date.now(),
            remetente: $('#remetente').val().trim(),
            destinatario: $('#destinatario').val().trim(),
            dataHora: $('#dataHora').val(),
            texto: $('#texto').val().trim(),
            dataCriacao: new Date().toISOString()
        };

        this.recados.push(recado);
        this.salvarRecados();
        this.renderizarRecados();
        this.limparFormulario();
        this.mostrarNotificacao('Recado adicionado com sucesso!', 'success');
        
        // Efeito visual com jQuery
        $('#lista-recados').find('.recado-card:last').hide().slideDown(500);
    }

    // Renderizar lista de recados
    renderizarRecados() {
        const container = $('#lista-recados');
        const mensagemVazia = $('#mensagem-vazia');

        if (this.recados.length === 0) {
            container.empty();
            mensagemVazia.show();
            $('#total-recados').text('0');
            return;
        }

        mensagemVazia.hide();
        container.empty();

        this.recados.forEach(recado => {
            const card = this.criarCardRecado(recado);
            container.append(card);
        });

        $('#total-recados').text(this.recados.length);
    }

    // Criar card de recado
    criarCardRecado(recado) {
        const dataFormatada = this.formatarData(recado.dataHora);
        const tempoDecorrido = this.calcularTempoDecorrido(recado.dataCriacao);

        return `
            <div class="col-md-6 col-lg-4" data-id="${recado.id}">
                <div class="card recado-card h-100">
                    <div class="card-header bg-light">
                        <div class="d-flex justify-content-between align-items-center">
                            <h6 class="card-title mb-0">
                                <i class="bi bi-chat-dots text-primary me-2"></i>
                                ${this.escapeHtml(recado.remetente)}
                            </h6>
                            <button class="btn btn-sm btn-outline-danger" onclick="sistema.removerRecado(${recado.id})">
                                <i class="bi bi-trash"></i>
                            </button>
                        </div>
                    </div>
                    <div class="card-body">
                        <div class="mb-3">
                            <strong><i class="bi bi-person-check text-info me-1"></i>Para:</strong>
                            <span class="ms-2">${this.escapeHtml(recado.destinatario)}</span>
                        </div>
                        <div class="mb-3">
                            <strong><i class="bi bi-calendar-event text-warning me-1"></i>Data:</strong>
                            <span class="ms-2">${dataFormatada}</span>
                        </div>
                        <div class="mb-3">
                            <strong><i class="bi bi-chat-text text-success me-1"></i>Mensagem:</strong>
                            <p class="mt-2 mb-0 text-muted">${this.escapeHtml(recado.texto)}</p>
                        </div>
                        <div class="text-end">
                            <small class="text-muted">
                                <i class="bi bi-clock me-1"></i>
                                ${tempoDecorrido}
                            </small>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    // Remover recado
    removerRecado(id) {
        const card = $(`.recado-card[data-id="${id}"]`).closest('.col-md-6');
        
        // Efeito de remoção com jQuery
        card.find('.recado-card').addClass('removendo');
        
        setTimeout(() => {
            this.recados = this.recados.filter(recado => recado.id !== id);
            this.salvarRecados();
            this.renderizarRecados();
            this.mostrarNotificacao('Recado removido com sucesso!', 'info');
        }, 500);
    }

    // Limpar formulário
    limparFormulario() {
        $('#form-recado')[0].reset();
        $('.form-control').removeClass('is-valid is-invalid');
        this.definirDataAtual();
        
        // Efeito visual
        $('#form-recado').fadeOut(200).fadeIn(200);
    }

    // Limpar todos os recados
    limparTodosRecados() {
        if (this.recados.length === 0) {
            this.mostrarNotificacao('Não há recados para limpar.', 'warning');
            return;
        }

        if (confirm('Tem certeza que deseja remover todos os recados?')) {
            // Efeito de fade out em todos os cards
            $('.recado-card').fadeOut(300, () => {
                this.recados = [];
                this.salvarRecados();
                this.renderizarRecados();
                this.mostrarNotificacao('Todos os recados foram removidos!', 'info');
            });
        }
    }

    // Ordenar por data
    ordenarPorData() {
        this.ordenacaoCrescente = !this.ordenacaoCrescente;
        
        this.recados.sort((a, b) => {
            const dataA = new Date(a.dataHora);
            const dataB = new Date(b.dataHora);
            
            return this.ordenacaoCrescente ? dataA - dataB : dataB - dataA;
        });

        this.renderizarRecados();
        
        const textoBotao = this.ordenacaoCrescente ? 'Ordenar por Data (Decrescente)' : 'Ordenar por Data (Crescente)';
        $('#btn-ordenar-data').html(`<i class="bi bi-sort-down me-1"></i>${textoBotao}`);
        
        this.mostrarNotificacao('Recados reordenados!', 'success');
    }

    // Atualizar interface
    atualizarInterface() {
        this.renderizarRecados();
    }

    // Definir data atual no campo de data
    definirDataAtual() {
        const agora = new Date();
        const dataHora = agora.toISOString().slice(0, 16);
        $('#dataHora').val(dataHora);
    }

    // Formatar data para exibição
    formatarData(dataHora) {
        const data = new Date(dataHora);
        return data.toLocaleString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    // Calcular tempo decorrido
    calcularTempoDecorrido(dataCriacao) {
        const agora = new Date();
        const criacao = new Date(dataCriacao);
        const diff = agora - criacao;
        
        const minutos = Math.floor(diff / (1000 * 60));
        const horas = Math.floor(diff / (1000 * 60 * 60));
        const dias = Math.floor(diff / (1000 * 60 * 60 * 24));

        if (dias > 0) {
            return `${dias} dia${dias > 1 ? 's' : ''} atrás`;
        } else if (horas > 0) {
            return `${horas} hora${horas > 1 ? 's' : ''} atrás`;
        } else if (minutos > 0) {
            return `${minutos} minuto${minutos > 1 ? 's' : ''} atrás`;
        } else {
            return 'Agora mesmo';
        }
    }

    // Escapar HTML para segurança
    escapeHtml(texto) {
        const div = document.createElement('div');
        div.textContent = texto;
        return div.innerHTML;
    }

    // Mostrar notificação
    mostrarNotificacao(mensagem, tipo = 'success') {
        const toast = $('#toast-notificacao');
        const toastBody = $('#toast-mensagem');
        const icon = toast.find('.toast-header i');

        // Configurar ícone e cor baseado no tipo
        switch (tipo) {
            case 'success':
                icon.removeClass().addClass('bi bi-check-circle-fill text-success me-2');
                break;
            case 'error':
                icon.removeClass().addClass('bi bi-x-circle-fill text-danger me-2');
                break;
            case 'warning':
                icon.removeClass().addClass('bi bi-exclamation-triangle-fill text-warning me-2');
                break;
            case 'info':
                icon.removeClass().addClass('bi bi-info-circle-fill text-info me-2');
                break;
        }

        toastBody.text(mensagem);
        
        // Mostrar toast com efeito
        toast.fadeIn(300);
        
        // Auto-hide após 3 segundos
        setTimeout(() => {
            toast.fadeOut(300);
        }, 3000);
    }

    // Salvar recados no localStorage
    salvarRecados() {
        try {
            localStorage.setItem('sistema-recados', JSON.stringify(this.recados));
        } catch (error) {
            console.error('Erro ao salvar no localStorage:', error);
            this.mostrarNotificacao('Erro ao salvar os dados.', 'error');
        }
    }

    // Carregar recados do localStorage
    carregarRecados() {
        try {
            const dados = localStorage.getItem('sistema-recados');
            if (dados) {
                this.recados = JSON.parse(dados);
            }
        } catch (error) {
            console.error('Erro ao carregar do localStorage:', error);
            this.recados = [];
        }
    }
}

// ===== INICIALIZAÇÃO =====

// Aguardar o DOM estar pronto
$(document).ready(() => {
    // Iniciar tela de loading decorativa
    iniciarLoading();
});

// ===== FUNÇÕES AUXILIARES =====

// Função para copiar recado (funcionalidade extra)
function copiarRecado(id) {
    const recado = sistema.recados.find(r => r.id === id);
    if (recado) {
        const texto = `Recado de ${recado.remetente} para ${recado.destinatario}:\n${recado.texto}`;
        navigator.clipboard.writeText(texto).then(() => {
            sistema.mostrarNotificacao('Recado copiado para a área de transferência!', 'success');
        });
    }
}

// Função para exportar recados (funcionalidade extra)
function exportarRecados() {
    if (sistema.recados.length === 0) {
        sistema.mostrarNotificacao('Não há recados para exportar.', 'warning');
        return;
    }

    const dados = JSON.stringify(sistema.recados, null, 2);
    const blob = new Blob([dados], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `recados-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    sistema.mostrarNotificacao('Recados exportados com sucesso!', 'success');
}

// Função para importar recados (funcionalidade extra)
function importarRecados() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const dados = JSON.parse(e.target.result);
                    if (Array.isArray(dados)) {
                        sistema.recados = [...sistema.recados, ...dados];
                        sistema.salvarRecados();
                        sistema.renderizarRecados();
                        sistema.mostrarNotificacao('Recados importados com sucesso!', 'success');
                    } else {
                        throw new Error('Formato inválido');
                    }
                } catch (error) {
                    sistema.mostrarNotificacao('Erro ao importar arquivo. Verifique o formato.', 'error');
                }
            };
            reader.readAsText(file);
        }
    };
    
    input.click();
}
