import type { Language } from '../types/execution/ExecutionTypes';

/**
 * 언어별 기본 코드 템플릿
 */
export const LANGUAGE_TEMPLATES: Record<Language, string> = {
    python: `# Python 3.11
print("Hello, World!")

# 변수와 데이터 타입
x = 42
name = "Python"
print(f"{name}: {x}")`,

    javascript: `// JavaScript (Node 20)
console.log("Hello, World!");

// 변수와 데이터 타입
const x = 42;
const name = "JavaScript";
console.log(\`\${name}: \${x}\`);`,

    java: `// Java 17
public class Main {
    public static void main(String[] args) {
        System.out.println("Hello, World!");
        
        // 변수와 데이터 타입
        int x = 42;
        String name = "Java";
        System.out.println(name + ": " + x);
    }
}`
};

/**
 * 지정된 언어의 기본 템플릿을 반환합니다.
 * @param language 언어 타입
 * @returns 해당 언어의 기본 템플릿 코드
 */
export function getLanguageTemplate(language: Language): string {
    return LANGUAGE_TEMPLATES[language];
}

/**
 * 코드가 비어있는지 확인합니다 (공백 제외)
 * @param code 확인할 코드
 * @returns 코드가 비어있으면 true
 */
export function isCodeEmpty(code: any): boolean {
    if (typeof code !== 'string') return true;
    return code.trim() === '';
}
