# API para controle de estoque e ponto de venda

## Clonar o repositório
```
git clone https://github.com/leoncoutinho1/ptdm_backend.git
```
## Donwloads necessários

A api foi feita em .Net 6, o sdk para execução pode ser baixado nesse [link](https://dotnet.microsoft.com/en-us/download/dotnet/6.0).
O banco de dados utilizado é MySQL que pode ser baixado junto com a ferramenta de gerenciamento [MySQL Workbench](https://www.mysql.com/products/workbench/).

## Execução

Após o download do projeto é preciso acessar a pasta onde foi gravado e executar o comando `dotnet restore` para fazer o download dos pacotes utilizados no projeto como o Entity Framework, Identity e Swagger.

Antes de executar é preciso criar o arquivo appsettings.json com o seguinte formato:
```
{
  "ConnectionStrings": {
    "DefaultConnection": <Aqui vai a string de conexao>
  }
}
```

O projeto foi configurado para rodar o database update a partir da migration durante a inicialização. Sendo assim basta executar `dotnet run` para subir a api.

## Próximos passos

- [ ] Implementar a autenticação e autorização com o Identity