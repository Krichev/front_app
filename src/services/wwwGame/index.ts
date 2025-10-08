// src/services/wwwGame/index.ts
// Central export file for all WWW Game services

// Export the base game service
export { WWWGameService } from './wwwGameService';

// Export the extended game service with question integration
export { WWWGameServiceWithQuestions } from './wwwGameServiceWithQuestions';

// Export the question service for direct access to questions
export { QuestionService } from './questionService';

// Export types
export type { QuestionData } from './questionService';
export type {
    GameSettings,
    RoundData,
    PlayerPerformance,
    GamePhase
} from './wwwGameService';

// Export the DeepSeek AI host service
export { DeepSeekHostService } from './deepseekHostService';

/**
 * Initialize all WWW Game services
 */
export function initializeWWWGameServices(config?: {
    apiKey?: string;
    enableExtendedFeatures?: boolean;
}) {
    // Import services
    import('./questionService').then(({ QuestionService }) => {
        // Initialize question service
        if (typeof QuestionService.initialize === 'function') {
            QuestionService.initialize();
            console.log('WWW Game Question Service initialized');
        }
    });

    // Initialize AI host service if API key provided
    if (config?.apiKey) {
        import('./deepseekHostService').then(({ DeepSeekHostService }) => {
            DeepSeekHostService.initialize({
                apiKey: config.apiKey,
                model: 'deepseek-chat',
                fallbackToLocal: true,
                language: 'en',
                temperature: 0.7,
                maxTokens: 200
            });
            console.log('WWW Game AI Host Service initialized');
        });
    }

    // Extend the question service with AI capabilities
    // if (config?.enableExtendedFeatures) {
    //     import('./questionService').then(({ QuestionService }) => {
    //         if (typeof QuestionService.extendGPT4HostService === 'function') {
    //             QuestionService.extendGPT4HostService();
    //             console.log('WWW Game Question Service extended with AI capabilities');
    //         }
    //     });
    // }
}