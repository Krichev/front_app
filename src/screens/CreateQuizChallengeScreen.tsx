// // src/screens/CreateQuizChallengeScreen.tsx
// import React, {useState} from 'react';
// import {ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View,} from 'react-native';
// import {useNavigation} from '@react-navigation/native';
// import {Picker} from '@react-native-picker/picker';
// import {QuizConfig} from '../entities/QuizState/model/slice/quizApi';
// import {
//     CreateQuizChallengeRequest,
//     useCreateQuizChallengeMutation
// } from '../entities/ChallengeState/model/slice/challengeApi';
// import {mapQuizConfigToBackend} from '../utils/quizConfigMapper';
// import {QuizConfigForm} from '../components/QuizConfigForm';
//
// interface Question {
//     question: string;
//     answer: string;
//     difficulty: 'EASY' | 'MEDIUM' | 'HARD';
//     topic?: string;
//     additionalInfo?: string;
// }
//
// export const CreateQuizChallengeScreen = () => {
//     const navigation = useNavigation();
//     const [createQuizChallenge, { isLoading }] = useCreateQuizChallengeMutation();
//
//     // Basic challenge info
//     const [title, setTitle] = useState('');
//     const [description, setDescription] = useState('');
//
//     // Quiz configuration with default values
//     const [quizConfig, setQuizConfig] = useState<QuizConfig>({
//         gameType: 'WWW',
//         teamName: '',
//         teamMembers: [],
//         difficulty: 'MEDIUM',
//         roundTime: 60,
//         roundCount: 10,
//         enableAIHost: true,
//         teamBased: false,
//     });
//
//     // Custom questions
//     const [questions, setQuestions] = useState<Question[]>([]);
//     const [currentQuestion, setCurrentQuestion] = useState<Question>({
//         question: '',
//         answer: '',
//         difficulty: 'MEDIUM',
//         topic: '',
//         additionalInfo: '',
//     });
//
//     // NEW: State for preview features
//     const [expandedQuestions, setExpandedQuestions] = useState<Set<number>>(new Set());
//     const [showAnswers, setShowAnswers] = useState<Set<number>>(new Set());
//     const [isQuestionsListCollapsed, setIsQuestionsListCollapsed] = useState(false);
//     const [currentPage, setCurrentPage] = useState(1);
//     const questionsPerPage = 5;
//
//     // Pagination calculations
//     const totalPages = Math.ceil(questions.length / questionsPerPage);
//     const startIndex = (currentPage - 1) * questionsPerPage;
//     const endIndex = startIndex + questionsPerPage;
//     const currentQuestions = questions.slice(startIndex, endIndex);
//
//     // Toggle answer visibility
//     const toggleAnswer = (index: number) => {
//         const globalIndex = startIndex + index;
//         setShowAnswers(prev => {
//             const newSet = new Set(prev);
//             if (newSet.has(globalIndex)) {
//                 newSet.delete(globalIndex);
//             } else {
//                 newSet.add(globalIndex);
//             }
//             return newSet;
//         });
//     };
//
//     // Toggle question expansion (for additional info)
//     const toggleExpansion = (index: number) => {
//         const globalIndex = startIndex + index;
//         setExpandedQuestions(prev => {
//             const newSet = new Set(prev);
//             if (newSet.has(globalIndex)) {
//                 newSet.delete(globalIndex);
//             } else {
//                 newSet.add(globalIndex);
//             }
//             return newSet;
//         });
//     };
//
//     // Pagination handlers
//     const goToNextPage = () => {
//         if (currentPage < totalPages) {
//             setCurrentPage(currentPage + 1);
//         }
//     };
//
//     const goToPreviousPage = () => {
//         if (currentPage > 1) {
//             setCurrentPage(currentPage - 1);
//         }
//     };
//
//     const goToPage = (page: number) => {
//         setCurrentPage(page);
//     };
//
//     // Validation
//     const validateForm = (): boolean => {
//         if (!title.trim()) {
//             Alert.alert('Error', 'Please enter a quiz title');
//             return false;
//         }
//         if (!description.trim()) {
//             Alert.alert('Error', 'Please enter a quiz description');
//             return false;
//         }
//         if (!quizConfig.teamName.trim()) {
//             Alert.alert('Error', 'Please enter a team name');
//             return false;
//         }
//         if (quizConfig.teamMembers.length === 0) {
//             Alert.alert('Error', 'Please add at least one team member');
//             return false;
//         }
//         return true;
//     };
//
//     // Add a custom question
//     const addQuestion = () => {
//         if (!currentQuestion.question.trim()) {
//             Alert.alert('Error', 'Please enter a question');
//             return;
//         }
//         if (!currentQuestion.answer.trim()) {
//             Alert.alert('Error', 'Please enter an answer');
//             return;
//         }
//
//         setQuestions([...questions, currentQuestion]);
//         setCurrentQuestion({
//             question: '',
//             answer: '',
//             difficulty: 'MEDIUM',
//             topic: '',
//             additionalInfo: '',
//         });
//
//         // Calculate the page where the new question will appear
//         const newTotalQuestions = questions.length + 1;
//         const newTotalPages = Math.ceil(newTotalQuestions / questionsPerPage);
//         setCurrentPage(newTotalPages); // Go to the last page
//
//         Alert.alert('Success', 'Question added successfully!');
//     };
//
//     // Remove a question
//     const removeQuestion = (displayIndex: number) => {
//         const globalIndex = startIndex + displayIndex;
//         Alert.alert(
//             'Remove Question',
//             'Are you sure you want to remove this question?',
//             [
//                 { text: 'Cancel', style: 'cancel' },
//                 {
//                     text: 'Remove',
//                     style: 'destructive',
//                     onPress: () => {
//                         setQuestions(questions.filter((_, i) => i !== globalIndex));
//                         // Clear states for removed question
//                         setShowAnswers(prev => {
//                             const newSet = new Set(prev);
//                             newSet.delete(globalIndex);
//                             return newSet;
//                         });
//                         setExpandedQuestions(prev => {
//                             const newSet = new Set(prev);
//                             newSet.delete(globalIndex);
//                             return newSet;
//                         });
//                         // Adjust page if necessary
//                         const newTotalPages = Math.ceil((questions.length - 1) / questionsPerPage);
//                         if (currentPage > newTotalPages && newTotalPages > 0) {
//                             setCurrentPage(newTotalPages);
//                         }
//                     },
//                 },
//             ]
//         );
//     };
//
//     // Get difficulty color
//     const getDifficultyColor = (difficulty: string): string => {
//         switch (difficulty) {
//             case 'EASY':
//                 return '#4CAF50';
//             case 'MEDIUM':
//                 return '#FF9800';
//             case 'HARD':
//                 return '#F44336';
//             default:
//                 return '#999';
//         }
//     };
//
//     // Create the quiz challenge
//     const handleCreateQuiz = async () => {
//         if (!validateForm()) return;
//
//         try {
//             console.log('Starting quiz challenge creation...');
//             console.log('Quiz Config:', quizConfig);
//
//             // Map the UI quiz config to backend format
//             const backendQuizConfig = mapQuizConfigToBackend(quizConfig);
//             console.log('Mapped Backend Config:', backendQuizConfig);
//
//             // Prepare custom questions for backend
//             const customQuestions = questions
//                 .filter(q => q.question.trim() && q.answer.trim())
//                 .map(q => ({
//                     question: q.question.trim(),
//                     answer: q.answer.trim(),
//                     difficulty: q.difficulty,
//                     topic: q.topic?.trim() || 'General',
//                     additionalInfo: q.additionalInfo?.trim(),
//                 }));
//
//             // Create the request
//             const request: CreateQuizChallengeRequest = {
//                 title: title.trim(),
//                 description: description.trim(),
//                 visibility: 'PUBLIC',
//                 frequency: 'ONE_TIME',
//                 quizConfig: backendQuizConfig,
//                 customQuestions: customQuestions,
//             };
//
//             console.log('Final Request:', JSON.stringify(request, null, 2));
//
//             // Send request to backend
//             const result = await createQuizChallenge(request).unwrap();
//
//             console.log('Challenge created successfully:', result);
//
//             // Success alert
//             Alert.alert(
//                 'Success! 🎉',
//                 `Quiz challenge "${title}" created successfully!\n\n` +
//                 `Team: ${quizConfig.teamName}\n` +
//                 `Members: ${quizConfig.teamMembers.join(', ')}\n` +
//                 `Difficulty: ${quizConfig.difficulty}\n` +
//                 `Questions: ${customQuestions.length} custom questions`,
//                 [
//                     {
//                         text: 'OK',
//                         onPress: () => navigation.goBack(),
//                     },
//                 ]
//             );
//         } catch (error: any) {
//             console.error('Error creating quiz challenge:', error);
//             Alert.alert(
//                 'Error',
//                 error?.data?.message ||
//                 error?.message ||
//                 'Failed to create quiz challenge. Please try again.'
//             );
//         }
//     };
//
//     return (
//         <ScrollView style={styles.container}>
//             <View style={styles.content}>
//                 {/* Header */}
//                 <Text style={styles.header}>Create Quiz Challenge</Text>
//                 <Text style={styles.subheader}>
//                     Fill in the details below to create your quiz challenge
//                 </Text>
//
//                 {/* Basic Info Section */}
//                 <View style={styles.card}>
//                     <Text style={styles.cardTitle}>Basic Information</Text>
//
//                     <View style={styles.inputGroup}>
//                         <Text style={styles.label}>Challenge Title *</Text>
//                         <TextInput
//                             style={styles.input}
//                             value={title}
//                             onChangeText={setTitle}
//                             placeholder="e.g., Team Trivia Challenge"
//                             placeholderTextColor="#999"
//                         />
//                     </View>
//
//                     <View style={styles.inputGroup}>
//                         <Text style={styles.label}>Description *</Text>
//                         <TextInput
//                             style={[styles.input, styles.textArea]}
//                             value={description}
//                             onChangeText={setDescription}
//                             placeholder="Describe your quiz challenge..."
//                             placeholderTextColor="#999"
//                             multiline
//                             numberOfLines={4}
//                         />
//                     </View>
//                 </View>
//
//                 {/* Quiz Configuration Section */}
//                 <View style={styles.card}>
//                     <Text style={styles.cardTitle}>Quiz Configuration</Text>
//                     <QuizConfigForm
//                         quizConfig={quizConfig}
//                         onConfigChange={setQuizConfig}
//                     />
//                 </View>
//
//                 {/* Custom Questions Section */}
//                 <View style={styles.card}>
//                     <View style={styles.questionHeaderRow}>
//                         <View>
//                             <Text style={styles.cardTitle}>
//                                 Custom Questions (Optional)
//                             </Text>
//                             <Text style={styles.cardDescription}>
//                                 Add your own questions or use our question bank
//                             </Text>
//                         </View>
//                     </View>
//
//                     {/* Existing Questions with Collapse */}
//                     {questions.length > 0 && (
//                         <View style={styles.questionsList}>
//                             {/* Collapse/Expand Header */}
//                             <TouchableOpacity
//                                 style={styles.collapseHeader}
//                                 onPress={() => setIsQuestionsListCollapsed(!isQuestionsListCollapsed)}
//                             >
//                                 <Text style={styles.questionsCount}>
//                                     {questions.length} question{questions.length !== 1 ? 's' : ''} added
//                                 </Text>
//                                 <Text style={styles.collapseIcon}>
//                                     {isQuestionsListCollapsed ? '▼' : '▲'}
//                                 </Text>
//                             </TouchableOpacity>
//
//                             {/* Questions List (Collapsible) */}
//                             {!isQuestionsListCollapsed && (
//                                 <>
//                                     {currentQuestions.map((q, displayIndex) => {
//                                         const globalIndex = startIndex + displayIndex;
//                                         const isAnswerVisible = showAnswers.has(globalIndex);
//                                         const isExpanded = expandedQuestions.has(globalIndex);
//
//                                         return (
//                                             <View key={globalIndex} style={styles.questionItem}>
//                                                 {/* Question Header with Number and Difficulty */}
//                                                 <View style={styles.questionContent}>
//                                                     <Text style={styles.questionNumber}>
//                                                         Q{globalIndex + 1}
//                                                     </Text>
//                                                     <View style={styles.questionDetails}>
//                                                         {/* Question Text - Full Display */}
//                                                         <Text style={styles.questionText}>
//                                                             {q.question}
//                                                         </Text>
//
//                                                         {/* Metadata Row */}
//                                                         <View style={styles.metaRow}>
//                                                             <View style={[
//                                                                 styles.difficultyBadge,
//                                                                 { backgroundColor: getDifficultyColor(q.difficulty) }
//                                                             ]}>
//                                                                 <Text style={styles.difficultyText}>
//                                                                     {q.difficulty}
//                                                                 </Text>
//                                                             </View>
//                                                             {q.topic && (
//                                                                 <Text style={styles.topicText}>
//                                                                     📚 {q.topic}
//                                                                 </Text>
//                                                             )}
//                                                         </View>
//
//                                                         {/* Show Answer Button */}
//                                                         <TouchableOpacity
//                                                             style={styles.showAnswerButton}
//                                                             onPress={() => toggleAnswer(displayIndex)}
//                                                         >
//                                                             <Text style={styles.showAnswerButtonText}>
//                                                                 {isAnswerVisible ? '👁️ Hide Answer' : '👁️‍🗨️ Show Answer'}
//                                                             </Text>
//                                                         </TouchableOpacity>
//
//                                                         {/* Answer Display (Conditional) */}
//                                                         {isAnswerVisible && (
//                                                             <View style={styles.answerContainer}>
//                                                                 <Text style={styles.answerLabel}>Answer:</Text>
//                                                                 <Text style={styles.answerText}>
//                                                                     {q.answer}
//                                                                 </Text>
//                                                             </View>
//                                                         )}
//
//                                                         {/* Additional Info (Expandable) */}
//                                                         {q.additionalInfo && (
//                                                             <>
//                                                                 <TouchableOpacity
//                                                                     style={styles.expandButton}
//                                                                     onPress={() => toggleExpansion(displayIndex)}
//                                                                 >
//                                                                     <Text style={styles.expandButtonText}>
//                                                                         {isExpanded ? '▲ Hide Details' : '▼ Show Details'}
//                                                                     </Text>
//                                                                 </TouchableOpacity>
//
//                                                                 {isExpanded && (
//                                                                     <View style={styles.additionalInfoContainer}>
//                                                                         <Text style={styles.additionalInfoLabel}>
//                                                                             Additional Info:
//                                                                         </Text>
//                                                                         <Text style={styles.additionalInfoText}>
//                                                                             {q.additionalInfo}
//                                                                         </Text>
//                                                                     </View>
//                                                                 )}
//                                                             </>
//                                                         )}
//                                                     </View>
//                                                 </View>
//
//                                                 {/* Delete Button */}
//                                                 <TouchableOpacity
//                                                     style={styles.deleteButton}
//                                                     onPress={() => removeQuestion(displayIndex)}
//                                                 >
//                                                     <Text style={styles.deleteButtonText}>
//                                                         🗑️ Remove
//                                                     </Text>
//                                                 </TouchableOpacity>
//                                             </View>
//                                         );
//                                     })}
//
//                                     {/* Pagination Controls */}
//                                     {totalPages > 1 && (
//                                         <View style={styles.paginationContainer}>
//                                             <TouchableOpacity
//                                                 style={[
//                                                     styles.paginationButton,
//                                                     currentPage === 1 && styles.paginationButtonDisabled
//                                                 ]}
//                                                 onPress={goToPreviousPage}
//                                                 disabled={currentPage === 1}
//                                             >
//                                                 <Text style={[
//                                                     styles.paginationButtonText,
//                                                     currentPage === 1 && styles.paginationButtonTextDisabled
//                                                 ]}>
//                                                     ← Previous
//                                                 </Text>
//                                             </TouchableOpacity>
//
//                                             <View style={styles.pageNumbersContainer}>
//                                                 {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
//                                                     <TouchableOpacity
//                                                         key={page}
//                                                         style={[
//                                                             styles.pageNumberButton,
//                                                             currentPage === page && styles.pageNumberButtonActive
//                                                         ]}
//                                                         onPress={() => goToPage(page)}
//                                                     >
//                                                         <Text style={[
//                                                             styles.pageNumberText,
//                                                             currentPage === page && styles.pageNumberTextActive
//                                                         ]}>
//                                                             {page}
//                                                         </Text>
//                                                     </TouchableOpacity>
//                                                 ))}
//                                             </View>
//
//                                             <TouchableOpacity
//                                                 style={[
//                                                     styles.paginationButton,
//                                                     currentPage === totalPages && styles.paginationButtonDisabled
//                                                 ]}
//                                                 onPress={goToNextPage}
//                                                 disabled={currentPage === totalPages}
//                                             >
//                                                 <Text style={[
//                                                     styles.paginationButtonText,
//                                                     currentPage === totalPages && styles.paginationButtonTextDisabled
//                                                 ]}>
//                                                     Next →
//                                                 </Text>
//                                             </TouchableOpacity>
//                                         </View>
//                                     )}
//
//                                     {/* Page Info */}
//                                     <Text style={styles.pageInfo}>
//                                         Showing {startIndex + 1}-{Math.min(endIndex, questions.length)} of {questions.length} questions
//                                     </Text>
//                                 </>
//                             )}
//                         </View>
//                     )}
//
//                     {/* Add Question Form */}
//                     <View style={styles.addQuestionForm}>
//                         <Text style={styles.formSubtitle}>Add New Question</Text>
//
//                         <View style={styles.inputGroup}>
//                             <Text style={styles.label}>Question *</Text>
//                             <TextInput
//                                 style={[styles.input, styles.textArea]}
//                                 value={currentQuestion.question}
//                                 onChangeText={(text) =>
//                                     setCurrentQuestion({
//                                         ...currentQuestion,
//                                         question: text,
//                                     })
//                                 }
//                                 placeholder="Enter your question here..."
//                                 placeholderTextColor="#999"
//                                 multiline
//                                 numberOfLines={3}
//                             />
//                         </View>
//
//                         <View style={styles.inputGroup}>
//                             <Text style={styles.label}>Answer *</Text>
//                             <TextInput
//                                 style={styles.input}
//                                 value={currentQuestion.answer}
//                                 onChangeText={(text) =>
//                                     setCurrentQuestion({
//                                         ...currentQuestion,
//                                         answer: text,
//                                     })
//                                 }
//                                 placeholder="Enter the answer..."
//                                 placeholderTextColor="#999"
//                             />
//                         </View>
//
//                         <View style={styles.inputGroup}>
//                             <Text style={styles.label}>Difficulty</Text>
//                             <View style={styles.pickerContainer}>
//                                 <Picker
//                                     selectedValue={currentQuestion.difficulty}
//                                     onValueChange={(value) =>
//                                         setCurrentQuestion({
//                                             ...currentQuestion,
//                                             difficulty: value as 'EASY' | 'MEDIUM' | 'HARD',
//                                         })
//                                     }
//                                     style={styles.picker}>
//                                     <Picker.Item label="Easy" value="EASY" />
//                                     <Picker.Item label="Medium" value="MEDIUM" />
//                                     <Picker.Item label="Hard" value="HARD" />
//                                 </Picker>
//                             </View>
//                         </View>
//
//                         <View style={styles.inputGroup}>
//                             <Text style={styles.label}>Topic (Optional)</Text>
//                             <TextInput
//                                 style={styles.input}
//                                 value={currentQuestion.topic}
//                                 onChangeText={(text) =>
//                                     setCurrentQuestion({
//                                         ...currentQuestion,
//                                         topic: text,
//                                     })
//                                 }
//                                 placeholder="e.g., Science, History, Sports"
//                                 placeholderTextColor="#999"
//                             />
//                         </View>
//
//                         <View style={styles.inputGroup}>
//                             <Text style={styles.label}>
//                                 Additional Info (Optional)
//                             </Text>
//                             <TextInput
//                                 style={[styles.input, styles.textArea]}
//                                 value={currentQuestion.additionalInfo}
//                                 onChangeText={(text) =>
//                                     setCurrentQuestion({
//                                         ...currentQuestion,
//                                         additionalInfo: text,
//                                     })
//                                 }
//                                 placeholder="Any additional context or explanation..."
//                                 placeholderTextColor="#999"
//                                 multiline
//                                 numberOfLines={3}
//                             />
//                         </View>
//
//                         <TouchableOpacity
//                             style={styles.addQuestionButton}
//                             onPress={addQuestion}>
//                             <Text style={styles.addQuestionButtonText}>
//                                 ➕ Add Question
//                             </Text>
//                         </TouchableOpacity>
//                     </View>
//                 </View>
//
//                 {/* Create Button */}
//                 <TouchableOpacity
//                     style={[
//                         styles.createButton,
//                         isLoading && styles.createButtonDisabled,
//                     ]}
//                     onPress={handleCreateQuiz}
//                     disabled={isLoading}>
//                     {isLoading ? (
//                         <ActivityIndicator color="#fff" />
//                     ) : (
//                         <Text style={styles.createButtonText}>
//                             Create Quiz Challenge
//                         </Text>
//                     )}
//                 </TouchableOpacity>
//
//                 <View style={styles.spacer} />
//             </View>
//         </ScrollView>
//     );
// };
//
// const styles = StyleSheet.create({
//     container: {
//         flex: 1,
//         backgroundColor: '#f5f5f5',
//     },
//     content: {
//         padding: 16,
//     },
//     header: {
//         fontSize: 28,
//         fontWeight: '700',
//         color: '#333',
//         marginBottom: 8,
//     },
//     subheader: {
//         fontSize: 16,
//         color: '#666',
//         marginBottom: 24,
//     },
//     card: {
//         backgroundColor: '#fff',
//         borderRadius: 12,
//         padding: 16,
//         marginBottom: 16,
//         shadowColor: '#000',
//         shadowOffset: {width: 0, height: 2},
//         shadowOpacity: 0.1,
//         shadowRadius: 4,
//         elevation: 3,
//     },
//     cardTitle: {
//         fontSize: 20,
//         fontWeight: '700',
//         color: '#333',
//         marginBottom: 8,
//     },
//     cardDescription: {
//         fontSize: 14,
//         color: '#666',
//         marginBottom: 16,
//     },
//     inputGroup: {
//         marginBottom: 16,
//     },
//     label: {
//         fontSize: 16,
//         fontWeight: '600',
//         color: '#333',
//         marginBottom: 8,
//     },
//     input: {
//         borderWidth: 1,
//         borderColor: '#ddd',
//         borderRadius: 8,
//         padding: 12,
//         fontSize: 16,
//         backgroundColor: '#fff',
//     },
//     textArea: {
//         height: 100,
//         textAlignVertical: 'top',
//     },
//     pickerContainer: {
//         borderWidth: 1,
//         borderColor: '#ddd',
//         borderRadius: 8,
//         backgroundColor: '#fff',
//         overflow: 'hidden',
//     },
//     picker: {
//         height: 50,
//     },
//     questionHeaderRow: {
//         flexDirection: 'row',
//         justifyContent: 'space-between',
//         alignItems: 'flex-start',
//         marginBottom: 8,
//     },
//     questionsList: {
//         marginBottom: 16,
//     },
//     collapseHeader: {
//         flexDirection: 'row',
//         justifyContent: 'space-between',
//         alignItems: 'center',
//         backgroundColor: '#f0f0f0',
//         padding: 12,
//         borderRadius: 8,
//         marginBottom: 12,
//     },
//     questionsCount: {
//         fontSize: 16,
//         fontWeight: '600',
//         color: '#4CAF50',
//     },
//     collapseIcon: {
//         fontSize: 18,
//         fontWeight: '700',
//         color: '#666',
//     },
//     questionItem: {
//         backgroundColor: '#f8f8f8',
//         borderRadius: 8,
//         padding: 14,
//         marginBottom: 12,
//         borderWidth: 1,
//         borderColor: '#e0e0e0',
//     },
//     questionContent: {
//         flexDirection: 'row',
//         marginBottom: 8,
//     },
//     questionNumber: {
//         fontSize: 18,
//         fontWeight: '700',
//         color: '#2196F3',
//         marginRight: 12,
//         minWidth: 35,
//     },
//     questionDetails: {
//         flex: 1,
//     },
//     questionText: {
//         fontSize: 16,
//         fontWeight: '600',
//         color: '#333',
//         marginBottom: 10,
//         lineHeight: 24,
//     },
//     metaRow: {
//         flexDirection: 'row',
//         alignItems: 'center',
//         gap: 12,
//         marginBottom: 10,
//     },
//     difficultyBadge: {
//         paddingHorizontal: 10,
//         paddingVertical: 4,
//         borderRadius: 12,
//     },
//     difficultyText: {
//         color: '#fff',
//         fontSize: 12,
//         fontWeight: '600',
//     },
//     topicText: {
//         fontSize: 13,
//         color: '#666',
//         fontStyle: 'italic',
//     },
//     showAnswerButton: {
//         backgroundColor: '#2196F3',
//         paddingHorizontal: 14,
//         paddingVertical: 8,
//         borderRadius: 6,
//         alignSelf: 'flex-start',
//         marginBottom: 8,
//     },
//     showAnswerButtonText: {
//         color: '#fff',
//         fontSize: 14,
//         fontWeight: '600',
//     },
//     answerContainer: {
//         backgroundColor: '#fff',
//         borderWidth: 2,
//         borderColor: '#4CAF50',
//         borderRadius: 8,
//         padding: 12,
//         marginTop: 8,
//         marginBottom: 8,
//     },
//     answerLabel: {
//         fontSize: 13,
//         fontWeight: '700',
//         color: '#4CAF50',
//         marginBottom: 4,
//     },
//     answerText: {
//         fontSize: 15,
//         color: '#333',
//         lineHeight: 22,
//     },
//     expandButton: {
//         backgroundColor: '#9E9E9E',
//         paddingHorizontal: 12,
//         paddingVertical: 6,
//         borderRadius: 6,
//         alignSelf: 'flex-start',
//         marginTop: 6,
//     },
//     expandButtonText: {
//         color: '#fff',
//         fontSize: 13,
//         fontWeight: '600',
//     },
//     additionalInfoContainer: {
//         backgroundColor: '#f0f0f0',
//         borderRadius: 6,
//         padding: 10,
//         marginTop: 8,
//     },
//     additionalInfoLabel: {
//         fontSize: 12,
//         fontWeight: '600',
//         color: '#666',
//         marginBottom: 4,
//     },
//     additionalInfoText: {
//         fontSize: 14,
//         color: '#555',
//         lineHeight: 20,
//     },
//     deleteButton: {
//         backgroundColor: '#ff4444',
//         paddingHorizontal: 14,
//         paddingVertical: 8,
//         borderRadius: 6,
//         alignSelf: 'flex-start',
//         marginTop: 8,
//     },
//     deleteButtonText: {
//         color: '#fff',
//         fontSize: 14,
//         fontWeight: '600',
//     },
//     paginationContainer: {
//         flexDirection: 'row',
//         justifyContent: 'space-between',
//         alignItems: 'center',
//         marginTop: 16,
//         marginBottom: 8,
//     },
//     paginationButton: {
//         backgroundColor: '#2196F3',
//         paddingHorizontal: 16,
//         paddingVertical: 10,
//         borderRadius: 6,
//     },
//     paginationButtonDisabled: {
//         backgroundColor: '#ccc',
//     },
//     paginationButtonText: {
//         color: '#fff',
//         fontSize: 14,
//         fontWeight: '600',
//     },
//     paginationButtonTextDisabled: {
//         color: '#999',
//     },
//     pageNumbersContainer: {
//         flexDirection: 'row',
//         gap: 8,
//     },
//     pageNumberButton: {
//         backgroundColor: '#f0f0f0',
//         paddingHorizontal: 12,
//         paddingVertical: 8,
//         borderRadius: 6,
//         minWidth: 36,
//         alignItems: 'center',
//     },
//     pageNumberButtonActive: {
//         backgroundColor: '#2196F3',
//     },
//     pageNumberText: {
//         color: '#333',
//         fontSize: 14,
//         fontWeight: '600',
//     },
//     pageNumberTextActive: {
//         color: '#fff',
//     },
//     pageInfo: {
//         fontSize: 13,
//         color: '#666',
//         textAlign: 'center',
//         marginTop: 8,
//     },
//     addQuestionForm: {
//         borderTopWidth: 1,
//         borderTopColor: '#eee',
//         paddingTop: 16,
//         marginTop: 8,
//     },
//     formSubtitle: {
//         fontSize: 16,
//         fontWeight: '600',
//         color: '#333',
//         marginBottom: 16,
//     },
//     addQuestionButton: {
//         backgroundColor: '#4CAF50',
//         padding: 14,
//         borderRadius: 8,
//         alignItems: 'center',
//     },
//     addQuestionButtonText: {
//         color: '#fff',
//         fontSize: 16,
//         fontWeight: '600',
//     },
//     createButton: {
//         backgroundColor: '#2196F3',
//         padding: 16,
//         borderRadius: 8,
//         alignItems: 'center',
//         marginTop: 8,
//     },
//     createButtonDisabled: {
//         backgroundColor: '#ccc',
//     },
//     createButtonText: {
//         color: '#fff',
//         fontSize: 18,
//         fontWeight: '700',
//     },
//     spacer: {
//         height: 40,
//     },
// });