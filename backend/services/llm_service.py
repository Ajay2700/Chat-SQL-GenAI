def get_llm(provider: str, api_key: str, model: str, streaming: bool = False):
    if provider == "openai":
        from langchain_openai import ChatOpenAI
        return ChatOpenAI(api_key=api_key, model=model, streaming=streaming, temperature=0)
    from langchain_groq import ChatGroq
    return ChatGroq(groq_api_key=api_key, model_name=model, streaming=streaming, temperature=0)
