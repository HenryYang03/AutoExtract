"""
Models module for AutoExtract backend application.

This module handles the initialization and management of machine learning
models used for graph analysis.
"""

from bar_graph_analyzer import BarGraphAnalyzer
from config import MODEL_PATH, CLASS_NAMES, TESSERACT_CMD


class ModelManager:
    """
    Manages the BarGraphAnalyzer model instance.
    
    This class provides a centralized way to manage the graph analysis
    model, including initialization and access to the analyzer instance.
    """
    
    def __init__(self):
        """Initialize the ModelManager with a BarGraphAnalyzer instance."""
        self.analyzer = None
        self._initialize_analyzer()
    
    def _initialize_analyzer(self) -> None:
        """
        Initialize the BarGraphAnalyzer with configured parameters.
        
        Creates a new BarGraphAnalyzer instance using the model path,
        class names, and tesseract command from configuration.
        """
        try:
            self.analyzer = BarGraphAnalyzer(
                model_path=MODEL_PATH,
                class_names=CLASS_NAMES,
                pytesseract_cmd=TESSERACT_CMD
            )
        except Exception as e:
            print(f"Failed to initialize BarGraphAnalyzer: {e}")
            self.analyzer = None
    
    def get_analyzer(self) -> BarGraphAnalyzer:
        """
        Get the current BarGraphAnalyzer instance.
        
        Returns:
            BarGraphAnalyzer: The initialized analyzer instance
            
        Raises:
            RuntimeError: If the analyzer failed to initialize
        """
        if self.analyzer is None:
            raise RuntimeError("BarGraphAnalyzer not initialized")
        return self.analyzer
    
    def is_ready(self) -> bool:
        """
        Check if the model is ready for use.
        
        Returns:
            bool: True if the analyzer is initialized, False otherwise
        """
        return self.analyzer is not None


# Global model manager instance
model_manager = ModelManager() 