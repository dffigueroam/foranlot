
import React, { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus, X, Target, Flame, Snowflake, TrendingUp, Loader2, AlertCircle, CheckCircle2 } from "lucide-react"
import {
	analyzeHotNumbersAction,
	analyzeColdNumbersAction,
	analyzeNumberPatternsAction,
	getUserDailyLimitsAction,
} from "@/app/actions/tool-analyzers"
import { HeatmapTool } from "./heatmap-tool"

interface ToolLimits {
	totalUses: number
	freeRemaining: number
	premiumRemaining: number
	isPremium: boolean
	maxUses: number
}

export const NumberAnalyzerTools = React.memo(function NumberAnalyzerTools({ isPremium, showCountryHeader = false, country, userNumbers, setUserNumbers, selectedLottery }: {
	isPremium: boolean,
	showCountryHeader?: boolean,
	country: string,
	userNumbers: string[],
	setUserNumbers: (nums: string[]) => void,
	selectedLottery: string
}) {
	const lotteryType = selectedLottery;
	const [loading, setLoading] = useState(false)
	const [result, setResult] = useState<any>(null)
	const [error, setError] = useState<string | null>(null)
	const [limits, setLimits] = useState<ToolLimits | null>(null)
	const [activeTool, setActiveTool] = useState<"hot" | "cold" | "patterns" | "loteries" | null>(null)
	const [mounted, setMounted] = useState(false)
	const memoizedResult = useMemo(() => result, [result])
	useEffect(() => setMounted(true), [])
	useEffect(() => { if (mounted) loadLimits() }, [mounted])
	if (!mounted) return null
	async function loadLimits() {
		const response = await getUserDailyLimitsAction()
		if (response.success && response.limits) {
			setLimits(response.limits)
		}
	}
	function addNumberField() { setUserNumbers([...userNumbers, ""]); }
	function removeNumberField(index: number) { setUserNumbers(userNumbers.filter((_, i) => i !== index)); }
	function updateNumber(index: number, value: string) {
		const digitCount = parseInt(lotteryType.split("_")[0]);
		const cleanValue = value.replace(/\D/g, "").slice(0, digitCount);
		const newNumbers = [...userNumbers];
		newNumbers[index] = cleanValue;
		setUserNumbers(newNumbers);
	}
	function validateNumbers(): string[] {
		const digitCount = parseInt(lotteryType.split("_")[0]);
		return userNumbers.filter(n => n.length === digitCount && /^\d+$/.test(n))
	}
	async function runHotNumbersAnalysis() {
		const validNumbers = validateNumbers()
		if (validNumbers.length === 0) { setError("Ingresa al menos un número válido"); return }
		setLoading(true); setError(null); setResult(null); setActiveTool("hot")
		const response = await analyzeHotNumbersAction(validNumbers, lotteryType, country)
		if (response.error) { setError(response.error) } else if (response.success) { setResult(response.result); await loadLimits() }
		setLoading(false)
	}
	async function runColdNumbersAnalysis() {
		const validNumbers = validateNumbers()
		if (validNumbers.length === 0) { setError("Ingresa al menos un número válido"); return }
		setLoading(true); setError(null); setResult(null); setActiveTool("cold")
		const response = await analyzeColdNumbersAction(validNumbers, lotteryType, country)
		if (response.error) { setError(response.error) } else if (response.success) { setResult(response.result); await loadLimits() }
		setLoading(false)
	}
	async function runPatternAnalysis() {
		const validNumbers = validateNumbers()
		if (validNumbers.length === 0) { setError("Ingresa al menos un número válido"); return }
		setLoading(true); setError(null); setResult(null); setActiveTool("patterns")
		const response = await analyzeNumberPatternsAction(validNumbers, lotteryType)
		if (response.error) { setError(response.error) } else if (response.success) { setResult(response.result); await loadLimits() }
		setLoading(false)
	}
	async function runNumberLoteriesAnalysis() {
		const validNumbers = validateNumbers()
		if (validNumbers.length === 0) { setError("Ingresa al menos un número válido"); return }
		setLoading(true); setError(null); setResult(null); setActiveTool("loteries")
		const digitCount = parseInt(lotteryType.split("_")[0]);
		const response = await import("@/app/actions/tool-analyzers").then(mod => mod.analyzeNumberByLoteriesAction(validNumbers, country, digitCount))
		if (response.error) { setError(response.error) } else if (response.success) { setResult(response.result); await loadLimits() }
		setLoading(false)
	}
	const digitCount = parseInt(lotteryType.split("_")[0]);
	return (
		<div className="space-y-6">
			{/* Herramienta: Mapa de calor de cifras */}
			<div className="my-8">
				<Card className="border-2 border-pink-500 bg-pink-50 dark:bg-pink-900/30">
					<CardHeader>
						<CardTitle className="flex items-center gap-2 text-lg">
							<Target className="w-5 h-5 text-pink-500" />
							Mapa de calor de cifras (últimos 3 días)
						</CardTitle>
						<CardDescription className="text-xs">
							Visualiza la frecuencia de cada cifra por posición en los últimos 3 días, por país y tipo de lotería
						</CardDescription>
					</CardHeader>
					<CardContent>
						<HeatmapTool preferredCountry={country === "COL" ? "Colombia" : country === "ESP" ? "España" : "Estados Unidos"} />
					</CardContent>
				</Card>
			</div>
			{/* Límites de uso */}
			{limits && (
				<Alert className="border-blue-500 bg-blue-50 dark:bg-blue-950/20">
					<AlertDescription className="flex items-center justify-between">
						<span className="text-sm font-medium text-blue-900 dark:text-blue-100">
							{isPremium
								? `Usos restantes hoy: ${limits.premiumRemaining} de ${limits.maxUses}`
								: `Usos restantes hoy: ${limits.freeRemaining} de ${limits.maxUses} (gratis)`}
						</span>
						{!isPremium && (
							<Badge variant="outline" className="bg-yellow-100 dark:bg-yellow-900/30">
								Hazte premium: 10 usos/día
							</Badge>
						)}
					</AlertDescription>
				</Alert>
			)}
			{/* Formulario simple y claro */}
			<div className="space-y-4">
				{/* Campo de entrada de números para analizar */}
				<div>
					<Label className="block mb-2 text-base font-semibold text-gray-800 dark:text-gray-100">Tus Números para Analizar</Label>
					<div className="flex flex-wrap gap-2 mb-2">
						{userNumbers.map((num, idx) => (
							<div key={idx} className="flex items-center gap-1">
								<Input
									type="text"
									value={num}
									onChange={e => updateNumber(idx, e.target.value)}
									maxLength={digitCount}
									className="w-20 text-center font-mono text-base"
									placeholder={"0".repeat(digitCount)}
								/>
								{userNumbers.length > 1 && (
									<Button type="button" size="icon" variant="ghost" onClick={() => removeNumberField(idx)} aria-label="Eliminar número">
										<X className="w-4 h-4 text-red-500" />
									</Button>
								)}
							</div>
						))}
						{userNumbers.length < 10 && (
							<Button type="button" size="icon" variant="outline" onClick={addNumberField} aria-label="Agregar número">
								<Plus className="w-4 h-4 text-green-600" />
							</Button>
						)}
					</div>
				</div>
				{/* El selector de tipo de lotería se controla globalmente, no aquí */}
				<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
					<Card
						className={`hover:shadow-md transition-shadow cursor-pointer border-2 ${activeTool === "hot" ? "border-orange-500 bg-orange-50 dark:bg-orange-900/30" : "border-transparent"}`}
						onClick={runHotNumbersAnalysis}
					>
						<CardHeader>
							<CardTitle className="flex items-center gap-2 text-lg">
								<Flame className="w-5 h-5 text-orange-500" />
								Números Calientes
							</CardTitle>
							<CardDescription className="text-xs">
								Encuentra números que se repiten en los últimos 15 sorteos
							</CardDescription>
						</CardHeader>
						<CardContent>
							<Button
								onClick={runHotNumbersAnalysis}
								disabled={loading}
								className="w-full"
							>
								{loading && activeTool === "hot" ? (
									<>
										<Loader2 className="w-4 h-4 mr-2 animate-spin" />
										Analizando...
									</>
								) : (
									"Analizar"
								)}
							</Button>
						</CardContent>
					</Card>
					<Card
						className={`hover:shadow-md transition-shadow cursor-pointer border-2 ${activeTool === "cold" ? "border-blue-500 bg-blue-50 dark:bg-blue-900/30" : "border-transparent"}`}
						onClick={runColdNumbersAnalysis}
					>
						<CardHeader>
							<CardTitle className="flex items-center gap-2 text-lg">
								<Snowflake className="w-5 h-5 text-blue-500" />
								Números Fríos
							</CardTitle>
							<CardDescription className="text-xs">
								Detecta dígitos que llevan tiempo sin salir en sus posiciones
							</CardDescription>
						</CardHeader>
						<CardContent>
							<Button
								onClick={runColdNumbersAnalysis}
								disabled={loading}
								className="w-full"
							>
								{loading && activeTool === "cold" ? (
									<>
										<Loader2 className="w-4 h-4 mr-2 animate-spin" />
										Analizando...
									</>
								) : (
									"Analizar"
								)}
							</Button>
						</CardContent>
					</Card>
					<Card
						className={`hover:shadow-md transition-shadow cursor-pointer border-2 ${activeTool === "patterns" ? "border-green-500 bg-green-50 dark:bg-green-900/30" : "border-transparent"}`}
						onClick={runPatternAnalysis}
					>
						<CardHeader>
							<CardTitle className="flex items-center gap-2 text-lg">
								<TrendingUp className="w-5 h-5 text-green-500" />
								Análisis de Patrones
							</CardTitle>
							<CardDescription className="text-xs">
								Detecta patrones estadísticos en tus números (secuencias, sumas, etc.)
							</CardDescription>
						</CardHeader>
						<CardContent>
							<Button
								onClick={runPatternAnalysis}
								disabled={loading}
								className="w-full"
							>
								{loading && activeTool === "patterns" ? (
									<>
										<Loader2 className="w-4 h-4 mr-2 animate-spin" />
										Analizando...
									</>
								) : (
									"Analizar"
								)}
							</Button>
						</CardContent>
					</Card>
					<Card
						className={`hover:shadow-md transition-shadow cursor-pointer border-2 ${activeTool === "loteries" ? "border-purple-500 bg-purple-50 dark:bg-purple-900/30" : "border-transparent"}`}
						onClick={runNumberLoteriesAnalysis}
					>
						<CardHeader>
							<CardTitle className="flex items-center gap-2 text-lg">
								<TrendingUp className="w-5 h-5 text-purple-500" />
								¿Dónde podría salir?
							</CardTitle>
							<CardDescription className="text-xs">
								Analiza en qué loterías de tu país tu número tiene más probabilidad de salir
							</CardDescription>
						</CardHeader>
						<CardContent>
							<Button
								onClick={runNumberLoteriesAnalysis}
								disabled={loading}
								className="w-full"
							>
								{loading && activeTool === "loteries" ? (
									<>
										<Loader2 className="w-4 h-4 mr-2 animate-spin" />
										Analizando...
									</>
								) : (
									"Analizar"
								)}
							</Button>
						</CardContent>
					</Card>
				</div>
			</div>
			{/* Errores */}
			{error && (
				<Alert variant="destructive">
					<AlertCircle className="w-4 h-4" />
					<AlertDescription>{error}</AlertDescription>
				</Alert>
			)}
			{/* Resultados */}
			{memoizedResult && activeTool === "hot" && (
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<Flame className="w-5 h-5 text-orange-500" />
							Resultados: Números Calientes
						</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						<Alert className="border-green-500 bg-green-50 dark:bg-green-950/20">
							<CheckCircle2 className="w-4 h-4 text-green-600" />
							<AlertDescription className="text-green-800 dark:text-green-200">
								{memoizedResult.summary.recommendation}
							</AlertDescription>
						</Alert>
						<div className="text-sm text-muted-foreground">
							Analizados: {memoizedResult.summary.totalAnalyzed} sorteos recientes | Coincidencias: {memoizedResult.summary.totalMatches}
						</div>
						{memoizedResult.matchedNumbers.length > 0 ? (
							<div className="space-y-2">
								{memoizedResult.matchedNumbers.map((match: any, i: number) => (
									<div key={i} className="p-4 bg-orange-50 dark:bg-orange-950/20 rounded-lg border border-orange-200 dark:border-orange-800">
										<div className="flex items-center justify-between mb-2">
											<span className="font-mono font-bold text-lg">{match.number}</span>
											<Badge
												variant="outline"
												className={
													match.matchQuality === "excellent"
														? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
														: match.matchQuality === "good"
														? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300"
														: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
												}
											>
												{match.matchQuality === "excellent" ? "Excelente" : match.matchQuality === "good" ? "Bueno" : "Parcial"}
											</Badge>
										</div>
										<div className="text-sm space-y-1">
											<p>
												✅ Frecuencia: {match.frequency} veces en últimos sorteos
											</p>
											<p>📅 Última vez: {new Date(match.lastSeen).toLocaleDateString("es-CO")}</p>
											<p>🎯 Posiciones coincidentes: {match.positionsMatch.join(", ")}</p>
										</div>
									</div>
								))}
							</div>
						) : (
							<p className="text-sm text-muted-foreground py-4 text-center">
								No se encontraron coincidencias directas con números calientes
							</p>
						)}
					</CardContent>
				</Card>
			)}
			{memoizedResult && activeTool === "cold" && (
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<Snowflake className="w-5 h-5 text-blue-500" />
							Resultados: Números Fríos
						</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						<Alert className={memoizedResult.summary.hasVeryOldDigits ? "border-blue-500 bg-blue-50 dark:bg-blue-950/20" : "border-green-500 bg-green-50 dark:bg-green-950/20"}>
							<AlertDescription>{memoizedResult.summary.recommendation}</AlertDescription>
						</Alert>
						{memoizedResult.analysis.length > 0 ? (
							<div className="space-y-3">
								{memoizedResult.analysis.map((item: any, i: number) => (
									<div key={i} className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
										<div className="font-mono font-bold text-lg mb-3">{item.userNumber}</div>
										<div className="space-y-2">
											{item.oldestDigits.map((digit: any, j: number) => (
												<div key={j} className="flex items-center justify-between text-sm">
													<span>
														Posición {digit.position + 1}: <strong className="font-mono">{digit.digit}</strong>
													</span>
													<div className="flex items-center gap-2">
														<span className="text-muted-foreground">
															{digit.daysSinceLastSeen === 999
																? "No ha salido"
																: `${digit.daysSinceLastSeen} días`}
														</span>
														<Badge
															variant="outline"
															className={
																digit.status === "muy_frio"
																	? "bg-blue-600 text-white"
																	: digit.status === "frio"
																	? "bg-blue-300 text-blue-900"
																	: "bg-gray-200 text-gray-700"
															}
														>
															{digit.status === "muy_frio" ? "Muy Frío" : digit.status === "frio" ? "Frío" : "Tibio"}
														</Badge>
													</div>
												</div>
											))}
										</div>
									</div>
								))}
							</div>
						) : (
							<p className="text-sm text-muted-foreground py-4 text-center">
								Todos tus números tienen cifras que han salido recientemente ✅
							</p>
						)}
					</CardContent>
				</Card>
			)}
			{memoizedResult && activeTool === "patterns" && (
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<TrendingUp className="w-5 h-5 text-green-500" />
							Resultados: Análisis de Patrones
						</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						<Alert className="border-green-500 bg-green-50 dark:bg-green-950/20">
							<AlertDescription className="text-green-800 dark:text-green-200">
								{memoizedResult.recommendation}
							</AlertDescription>
						</Alert>
						<div className="space-y-2">
							{memoizedResult.patterns.map((pattern: any, i: number) => (
								<div key={i} className="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg border">
									<div className="flex items-start justify-between mb-1">
										<span className="font-semibold text-sm">{pattern.type}</span>
										<Badge
											variant="outline"
											className={
												pattern.confidence === "high"
													? "bg-green-100 text-green-800 dark:bg-green-900/30"
													: pattern.confidence === "medium"
													? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30"
													: "bg-red-100 text-red-800 dark:bg-red-900/30"
											}
										>
											{pattern.confidence === "high" ? "Alta" : pattern.confidence === "medium" ? "Media" : "Baja"}
										</Badge>
									</div>
									<p className="text-sm text-muted-foreground">{pattern.description}</p>
								</div>
							))}
						</div>
					</CardContent>
				</Card>
			)}
			{memoizedResult && activeTool === "loteries" && (
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<TrendingUp className="w-5 h-5 text-purple-500" />
							Resultados: ¿Dónde podría salir?
						</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						{Object.entries(memoizedResult).map(([number, loterias]: any, idx) => (
							<div key={idx} className="mb-4">
								<div className="font-mono font-bold text-lg mb-2">{number}</div>
								{loterias.length > 0 ? (
									<ul className="space-y-1">
										{loterias.map((info: any, i: number) => (
											<li key={i} className="p-2 bg-purple-50 dark:bg-purple-950/20 rounded border border-purple-200 dark:border-purple-800">
												<span className="font-semibold">{info.lottery}</span>: {info.message}
												{info.freq !== undefined && (
													<span className="ml-2 text-xs text-muted-foreground">Frecuencia: {info.freq}</span>
												)}
												{info.atraso !== undefined && (
													<span className="ml-2 text-xs text-muted-foreground">Atraso: {info.atraso} días</span>
												)}
											</li>
										))}
									</ul>
								) : (
									<p className="text-sm text-muted-foreground">No se detectaron loterías con alta probabilidad para este número.</p>
								)}
							</div>
						))}
					</CardContent>
				</Card>
			)}
		</div>
	)
})
