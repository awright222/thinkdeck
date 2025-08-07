import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import type { Flashcard, FileUploadResult } from './types';
import { generateId } from './storage';

export const parseCSVFile = (file: File): Promise<FileUploadResult> => {
  return new Promise((resolve) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header: string) => header.toLowerCase().trim(),
      complete: (result) => {
        try {
          const cards: Flashcard[] = [];
          const data = result.data as any[];

          for (const row of data) {
            const question = row.question || row.q || row.front || '';
            const answer = row.answer || row.a || row.back || '';
            const imageUrl = row.imageurl || row.image || row.img || '';

            if (question.trim() && answer.trim()) {
              const newCard = {
                id: generateId(),
                question: question.trim(),
                answer: answer.trim(),
                imageUrl: imageUrl.trim() || undefined,
                correctCount: 0,
                incorrectCount: 0,
              };
              
              // Debug logging in development
              if (process.env.NODE_ENV === 'development' && imageUrl.trim()) {
                console.log('Parsed card with image:', {
                  question: question.trim(),
                  imageUrl: imageUrl.trim()
                });
              }
              
              cards.push(newCard);
            }
          }

          if (cards.length === 0) {
            resolve({
              success: false,
              error: 'No valid flashcards found. Make sure your file has "question" and "answer" columns.',
              fileName: file.name,
            });
          } else {
            resolve({
              success: true,
              cards,
              fileName: file.name,
            });
          }
        } catch (error) {
          resolve({
            success: false,
            error: `Error parsing CSV: ${error instanceof Error ? error.message : 'Unknown error'}`,
            fileName: file.name,
          });
        }
      },
      error: (error) => {
        resolve({
          success: false,
          error: `Failed to read CSV file: ${error.message}`,
          fileName: file.name,
        });
      }
    });
  });
};

export const parseExcelFile = (file: File): Promise<FileUploadResult> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        
        // Get first worksheet
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Convert to JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
        
        if (jsonData.length < 2) {
          resolve({
            success: false,
            error: 'Excel file must have at least 2 rows (header and data)',
            fileName: file.name,
          });
          return;
        }

        // Parse header row to find column indices
        const headerRow = jsonData[0].map((header: any) => 
          String(header || '').toLowerCase().trim()
        );
        
        const questionIndex = headerRow.findIndex(h => 
          h.includes('question') || h === 'q' || h.includes('front')
        );
        const answerIndex = headerRow.findIndex(h => 
          h.includes('answer') || h === 'a' || h.includes('back')
        );
        const imageIndex = headerRow.findIndex(h => 
          h.includes('image') || h.includes('img') || h.includes('imageurl')
        );

        if (questionIndex === -1 || answerIndex === -1) {
          resolve({
            success: false,
            error: 'Excel file must have "question" and "answer" columns',
            fileName: file.name,
          });
          return;
        }

        const cards: Flashcard[] = [];
        
        // Process data rows
        for (let i = 1; i < jsonData.length; i++) {
          const row = jsonData[i];
          const question = String(row[questionIndex] || '').trim();
          const answer = String(row[answerIndex] || '').trim();
          const imageUrl = imageIndex !== -1 
            ? String(row[imageIndex] || '').trim() 
            : '';

          if (question && answer) {
            const newCard = {
              id: generateId(),
              question,
              answer,
              imageUrl: imageUrl || undefined,
              correctCount: 0,
              incorrectCount: 0,
            };
            
            // Debug logging in development
            if (process.env.NODE_ENV === 'development' && imageUrl) {
              console.log('Parsed Excel card with image:', {
                question,
                imageUrl
              });
            }
            
            cards.push(newCard);
          }
        }

        if (cards.length === 0) {
          resolve({
            success: false,
            error: 'No valid flashcards found in Excel file',
            fileName: file.name,
          });
        } else {
          resolve({
            success: true,
            cards,
            fileName: file.name,
          });
        }
      } catch (error) {
        resolve({
          success: false,
          error: `Error parsing Excel file: ${error instanceof Error ? error.message : 'Unknown error'}`,
          fileName: file.name,
        });
      }
    };

    reader.onerror = () => {
      resolve({
        success: false,
        error: 'Failed to read Excel file',
        fileName: file.name,
      });
    };

    reader.readAsArrayBuffer(file);
  });
};

export const parseFile = async (file: File): Promise<FileUploadResult> => {
  const fileExtension = file.name.split('.').pop()?.toLowerCase();
  
  switch (fileExtension) {
    case 'csv':
      return parseCSVFile(file);
    case 'xlsx':
    case 'xls':
      return parseExcelFile(file);
    default:
      return {
        success: false,
        error: 'Unsupported file format. Please upload a CSV or Excel file.',
        fileName: file.name,
      };
  }
};

export const validateFileType = (file: File): boolean => {
  const allowedExtensions = ['csv', 'xlsx', 'xls'];
  const fileExtension = file.name.split('.').pop()?.toLowerCase();
  return allowedExtensions.includes(fileExtension || '');
};
