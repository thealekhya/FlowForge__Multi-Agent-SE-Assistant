"""
FlowForge AI — LLM Provider Factory (LangChain)

Returns a LangChain BaseChatModel based on the .env AI_PROVIDER setting.
Supports: gemini, openai, simulated (fallback fake LLM).
"""

from __future__ import annotations

from langchain_core.language_models.chat_models import BaseChatModel
from langchain_core.messages import AIMessage, BaseMessage
from langchain_core.outputs import ChatResult, ChatGeneration

from core.config import settings


class _SimulatedChatModel(BaseChatModel):
    """
    A zero-dependency fake chat model used when no API key is configured.
    Delegates to the existing SimulatedProvider for realistic template output.
    """

    model_name: str = "simulated"

    @property
    def _llm_type(self) -> str:
        return "simulated"

    def _generate(self, messages: list[BaseMessage], **kwargs) -> ChatResult:
        import asyncio
        from pipeline.ai_provider import SimulatedProvider

        provider = SimulatedProvider()
        system_prompt = ""
        user_prompt = ""
        for m in messages:
            if m.type == "system":
                system_prompt = m.content
            elif m.type == "human":
                user_prompt = m.content

        # Run the async simulated provider synchronously
        try:
            loop = asyncio.get_running_loop()
        except RuntimeError:
            loop = None

        if loop and loop.is_running():
            import concurrent.futures
            with concurrent.futures.ThreadPoolExecutor() as pool:
                result = pool.submit(
                    asyncio.run, provider.generate(system_prompt, user_prompt)
                ).result()
        else:
            result = asyncio.run(provider.generate(system_prompt, user_prompt))

        return ChatResult(
            generations=[ChatGeneration(message=AIMessage(content=result))]
        )

    async def _agenerate(self, messages: list[BaseMessage], **kwargs) -> ChatResult:
        from pipeline.ai_provider import SimulatedProvider

        provider = SimulatedProvider()
        system_prompt = ""
        user_prompt = ""
        for m in messages:
            if m.type == "system":
                system_prompt = m.content
            elif m.type == "human":
                user_prompt = m.content

        result = await provider.generate(system_prompt, user_prompt)
        return ChatResult(
            generations=[ChatGeneration(message=AIMessage(content=result))]
        )


def get_llm() -> BaseChatModel:
    """Factory: return the right LangChain chat model from .env settings."""
    provider = settings.AI_PROVIDER.lower()

    if provider == "gemini":
        from langchain_google_genai import ChatGoogleGenerativeAI

        return ChatGoogleGenerativeAI(
            model=settings.GEMINI_MODEL,
            google_api_key=settings.GEMINI_API_KEY,
            temperature=0.7,
            max_output_tokens=4096,
            max_retries=2,
            timeout=30,
        )

    if provider == "openai":
        from langchain_openai import ChatOpenAI

        return ChatOpenAI(
            model=settings.OPENAI_MODEL,
            api_key=settings.OPENAI_API_KEY,
            temperature=0.7,
            max_tokens=4096,
            max_retries=2,
            timeout=30,
        )

    # Default: simulated
    return _SimulatedChatModel()
