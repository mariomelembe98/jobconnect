# Guião de Demonstração do Produto (Tempo Connect)

Este documento descreve o fluxo de demonstração de 10 minutos do **Tempo Connect (ProConnect)**, ideal para apresentações de produto, auditorias de investidores ou sessões de garantia de qualidade (QA).

---

## Estrutura do Fluxo (10 Minutos)

O objetivo desta demonstração é mostrar o ciclo de vida completo de uma contratação no marketplace: desde a descoberta pública até à auditoria administrativa final.

---

### Passo 1: Landing Page (Página Inicial Pública)
* **Página**: [Landing Page / Home](file:///var/www/html/tempoconect.co.mz/resources/js/Pages/Landing.tsx) (`/`)
* **Ação**: Aceder à raiz do site e fazer scroll pelas secções principais.
* **Resultado Esperado**: Interface moderna e apelativa em português com destaque para categorias de serviços populares e profissionais verificados.
* **Pontos de Discussão**:
  * O Tempo Connect é focado no mercado de Moçambique.
  * A navegação inicial é intuitiva e permite encontrar profissionais diretamente na barra de pesquisa.

### Passo 2: Registo de Cliente (Register Client)
* **Página**: [Register](file:///var/www/html/tempoconect.co.mz/resources/js/Pages/Auth/Register.tsx) (`/register`)
* **Ação**: Preencher o formulário de registo selecionando o perfil de **Cliente** (ex: `Adriano Mucavele`, província de Maputo Cidade).
* **Resultado Esperado**: Registo concluído com sucesso e redirecionamento automático para o Painel do Cliente.
* **Pontos de Discussão**:
  * Processo de registo unificado com distinção clara de perfis (Cliente vs. Profissional).
  * Integração com as províncias e cidades de Moçambique no ecrã de perfil.

### Passo 3: Criação de Solicitação de Serviço (Client Creates Request)
* **Página**: [Criar Pedido de Serviço](file:///var/www/html/tempoconect.co.mz/resources/js/Pages/Client/ServiceRequests/Create.tsx) (`/client/service-requests/create`)
* **Ação**: Criar um pedido (ex: "Configuração de Wi-Fi doméstico") na categoria **Informática**, definir orçamento e anexar um ficheiro descritivo.
* **Resultado Esperado**: Validação em tempo real, publicação do pedido e redirecionamento para o ecrã de detalhes.
* **Pontos de Discussão**:
  * Suporte a anexos de imagens/documentos até 20MB.
  * Orçamento flexível (fixo, negociável ou preço por hora).

### Passo 4: Perfil Público do Profissional (Professional Profile)
* **Página**: [Diretório de Profissionais](file:///var/www/html/tempoconect.co.mz/resources/js/Pages/Professionals/Index.tsx) (`/professionals`) e [Perfil do Profissional](file:///var/www/html/tempoconect.co.mz/resources/js/Pages/Professionals/Show.tsx) (`/professionals/{id}`)
* **Ação**: Entrar no perfil de um profissional (ex: `Afonso Nhapulo`).
* **Resultado Esperado**: Exibição do headline, portfólio de trabalhos, selo de verificação ativa, biografia e classificação de avaliações.
* **Pontos de Discussão**:
  * Transparência total sobre as credenciais do profissional.
  * Portfólio visual para aumentar a conversão de contratações.

### Passo 5: Profissional Envia Proposta (Professional Submits Proposal)
* **Página**: [Detalhes do Trabalho](file:///var/www/html/tempoconect.co.mz/resources/js/Pages/Professional/Jobs/Show.tsx) (`/professional/jobs/{id}`)
* **Ação**: Iniciar sessão como o profissional (`professional1@demo.tempoconect.local`), ler o pedido do cliente e enviar uma proposta financeira (ex: 2.200 MT com prazo de 2 dias).
* **Resultado Esperado**: Proposta registada com sucesso e listada no painel de propostas enviadas do profissional.
* **Pontos de Discussão**:
  * O profissional visualiza detalhes do projeto antes de licitar.
  * Flexibilidade no valor e prazo proposto.

### Passo 6: Cliente Aceita Proposta (Client Accepts Proposal)
* **Página**: [Detalhes do Pedido do Cliente](file:///var/www/html/tempoconect.co.mz/resources/js/Pages/Client/ServiceRequests/Show.tsx) (`/client/service-requests/{id}`)
* **Ação**: Fazer login como o cliente criador do pedido, ver as propostas recebidas e clicar em "Aceitar Proposta" na proposta do profissional.
* **Resultado Esperado**: Pop-up de confirmação em português, atualização instantânea do estado do pedido e geração automática de um contrato.
* **Pontos de Discussão**:
  * Processo simplificado de negociação.
  * Ao aceitar uma proposta, o sistema congela a negociação e avança para a fase de contrato comercial.

### Passo 7: Criação do Contrato (Contract Created)
* **Página**: [Detalhes do Contrato](file:///var/www/html/tempoconect.co.mz/resources/js/Pages/Contracts/Show.tsx) (`/contracts/{id}`)
* **Ação**: Visualizar os termos do contrato ativo recém-criado.
* **Resultado Esperado**: Contrato com dados do cliente, profissional, valor bruto, taxa da plataforma (10%) e botões de ação contextuais.
* **Pontos de Discussão**:
  * Divisão transparente de taxas da plataforma.
  * O contrato serve como o acordo oficial que governa o início da execução.

### Passo 8: Conversa via Chat (Chat Conversation)
* **Página**: [Janela de Chat](file:///var/www/html/tempoconect.co.mz/resources/js/Pages/Conversations/Show.tsx) (`/conversations/{id}`)
* **Ação**: Enviar mensagens de alinhamento entre o cliente e o profissional.
* **Resultado Esperado**: Entrega imediata de mensagens, indicação de estado lido/não lido e suporte a partilha de imagens no chat.
* **Pontos de Discussão**:
  * Canal seguro para comunicação direta.
  * Preservação do histórico em caso de necessidade de mediação.

### Passo 9: Conclusão do Contrato (Contract Completed)
* **Página**: [Detalhes do Contrato](file:///var/www/html/tempoconect.co.mz/resources/js/Pages/Contracts/Show.tsx) (`/contracts/{id}`)
* **Ação**: O cliente clica no botão "Concluir Serviço" para fechar o contrato.
* **Resultado Esperado**: Estado do contrato alterado para "Concluído" com log na auditoria interna de estados.
* **Pontos de Discussão**:
  * Conclusão voluntária pelo cliente que atesta que o trabalho foi entregue satisfatoriamente.

### Passo 10: Envio de Avaliação (Review Submitted)
* **Página**: [Minhas Avaliações](file:///var/www/html/tempoconect.co.mz/resources/js/Pages/Reviews/Index.tsx) (`/reviews/me`)
* **Ação**: Abrir o modal de avaliação e deixar 5 estrelas e um comentário positivo sobre o profissional.
* **Resultado Esperado**: A classificação média e o número total de avaliações no perfil do profissional são recalculados instantaneamente.
* **Pontos de Discussão**:
  * Reputação baseada em avaliações autênticas associadas a contratos fechados.

### Passo 11: Moderação Administrativa (Admin Moderation)
* **Página**: [Dashboard do Administrador](file:///var/www/html/tempoconect.co.mz/resources/js/Pages/Admin/Dashboard.tsx) (`/admin`) e [Ecrã de Verificações](file:///var/www/html/tempoconect.co.mz/resources/js/Pages/Admin/Verifications.tsx) (`/admin/verifications`)
* **Ação**: Iniciar sessão como administrador (`admin@tempoconnect.local`) e examinar perfis pendentes de verificação de documentos.
* **Resultado Esperado**: Acesso a KPIs globais da plataforma e aprovação/rejeição de documentos privados dos profissionais com toda a segurança.
* **Pontos de Discussão**:
  * Download seguro de documentos de identificação.
  * Resolução centralizada de denúncias e disputas.

### Passo 12: Logs de Atividade (Activity Logs)
* **Página**: Banco de Dados / Visualização Administrativa de Auditoria (`activity_logs`)
* **Ação**: Demonstrar como as ações críticas realizadas durante o fluxo foram gravadas de forma imutável.
* **Resultado Esperado**: Presença de registos com data, utilizador, tipo de ação e metadados contextuais das operações críticas.
* **Pontos de Discussão**:
  * Rastreabilidade total para suporte técnico e conformidade regulamentar.
