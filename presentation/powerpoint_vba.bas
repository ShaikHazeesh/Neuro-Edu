Sub CreateNeuroEduPresentation()
    Dim ppt As Presentation
    Dim sld As Slide
    
    ' Create new presentation
    Set ppt = Application.Presentations.Add
    
    ' Slide 1: Title
    Set sld = ppt.Slides.Add(1, ppLayoutText)
    With sld.Shapes.Title
        .TextFrame.TextRange.Text = "NeuroEdu"
        .TextFrame.TextRange.Font.Size = 44
        .TextFrame.TextRange.Font.Bold = True
    End With
    With sld.Shapes.Item(2)
        .TextFrame.TextRange.Text = "AI-Powered Educational Platform with Real-time Emotion Detection" & vbNewLine & _
                                   "Team Members: [Your Names]"
        .TextFrame.TextRange.Font.Size = 28
    End With
    
    ' Slide 2: Abstract
    Set sld = ppt.Slides.Add(2, ppLayoutText)
    With sld.Shapes.Title
        .TextFrame.TextRange.Text = "Abstract"
    End With
    With sld.Shapes.Item(2)
        .TextFrame.TextRange.Text = "NeuroEdu is an innovative educational platform that combines:" & vbNewLine & _
                                   "• Real-time emotion detection" & vbNewLine & _
                                   "• Adaptive learning algorithms" & vbNewLine & _
                                   "• Mental health support" & vbNewLine & vbNewLine & _
                                   "The system uses facial recognition and expression analysis to:" & vbNewLine & _
                                   "• Monitor student engagement" & vbNewLine & _
                                   "• Adjust content delivery" & vbNewLine & _
                                   "• Provide timely mental health interventions" & vbNewLine & _
                                   "• Create personalized learning experiences"
    End With
    
    ' Slide 3: Objectives
    Set sld = ppt.Slides.Add(3, ppLayoutText)
    With sld.Shapes.Title
        .TextFrame.TextRange.Text = "Objectives"
    End With
    With sld.Shapes.Item(2)
        .TextFrame.TextRange.Text = "Primary Goals:" & vbNewLine & _
                                   "• Create an emotion-aware learning platform" & vbNewLine & _
                                   "• Improve student engagement through real-time adaptation" & vbNewLine & _
                                   "• Integrate mental health support into education" & vbNewLine & _
                                   "• Provide early intervention for struggling students" & vbNewLine & vbNewLine & _
                                   "Secondary Goals:" & vbNewLine & _
                                   "• Reduce learning stress" & vbNewLine & _
                                   "• Increase course completion rates" & vbNewLine & _
                                   "• Support different learning styles" & vbNewLine & _
                                   "• Create a supportive learning community"
    End With
    
    ' Slide 4: Methodology
    Set sld = ppt.Slides.Add(4, ppLayoutText)
    With sld.Shapes.Title
        .TextFrame.TextRange.Text = "Methodology"
    End With
    With sld.Shapes.Item(2)
        .TextFrame.TextRange.Text = "Implementation Approach:" & vbNewLine & vbNewLine & _
                                   "1. Data Collection" & vbNewLine & _
                                   "   • Real-time facial expression analysis" & vbNewLine & _
                                   "   • User interaction patterns" & vbNewLine & _
                                   "   • Learning progress metrics" & vbNewLine & vbNewLine & _
                                   "2. Processing Pipeline" & vbNewLine & _
                                   "   • Face detection using multiple models" & vbNewLine & _
                                   "   • Emotion classification" & vbNewLine & _
                                   "   • Content adaptation algorithms" & vbNewLine & vbNewLine & _
                                   "3. Feedback Loop" & vbNewLine & _
                                   "   • Real-time adjustments" & vbNewLine & _
                                   "   • Personalized suggestions" & vbNewLine & _
                                   "   • Mental health interventions"
    End With
    
    ' Slide 5: Tech Stack & Models
    Set sld = ppt.Slides.Add(5, ppLayoutText)
    With sld.Shapes.Title
        .TextFrame.TextRange.Text = "Tech Stack & Models"
    End With
    With sld.Shapes.Item(2)
        .TextFrame.TextRange.Text = "Frontend:" & vbNewLine & _
                                   "• React + TypeScript" & vbNewLine & _
                                   "• Vite + TailwindCSS" & vbNewLine & _
                                   "• WebRTC" & vbNewLine & vbNewLine & _
                                   "AI Models:" & vbNewLine & _
                                   "• TinyFaceDetector" & vbNewLine & _
                                   "• SSD MobileNet" & vbNewLine & _
                                   "• FaceLandmark68" & vbNewLine & _
                                   "• FaceExpressionNet"
    End With
    
    ' Continue with remaining slides...
    ' Slide 6: Model Architecture
    Set sld = ppt.Slides.Add(6, ppLayoutText)
    With sld.Shapes.Title
        .TextFrame.TextRange.Text = "Model Architecture"
    End With
    With sld.Shapes.Item(2)
        .TextFrame.TextRange.Text = "Core Models:" & vbNewLine & vbNewLine & _
                                   "1. TinyFaceDetector" & vbNewLine & _
                                   "   - Fast real-time detection" & vbNewLine & _
                                   "   - Optimized for web" & vbNewLine & vbNewLine & _
                                   "2. SSD MobileNet" & vbNewLine & _
                                   "   - High accuracy backup" & vbNewLine & _
                                   "   - Complex detection cases" & vbNewLine & vbNewLine & _
                                   "3. Expression Analysis" & vbNewLine & _
                                   "   - 7 emotion classifications" & vbNewLine & _
                                   "   - Real-time processing"
    End With
    
    ' Add formatting
    ApplyFormatting ppt
    
End Sub

Sub ApplyFormatting(ppt As Presentation)
    Dim sld As Slide
    Dim shp As Shape
    
    ' Define theme colors
    Const PRIMARY_COLOR = RGB(41, 128, 185)    ' Blue
    Const SECONDARY_COLOR = RGB(44, 62, 80)    ' Dark Gray
    Const TEXT_COLOR = RGB(52, 73, 94)         ' Slate
    
    For Each sld In ppt.Slides
        ' Format title
        With sld.Shapes.Title
            .TextFrame.TextRange.Font.Name = "Segoe UI"
            .TextFrame.TextRange.Font.Color = PRIMARY_COLOR
            .TextFrame.TextRange.Font.Size = 36
        End With
        
        ' Format body text
        For Each shp In sld.Shapes
            If shp.Type = msoTextBox Or shp.Type = msoPlaceholder Then
                With shp.TextFrame.TextRange
                    .Font.Name = "Segoe UI"
                    .Font.Color = TEXT_COLOR
                    .Font.Size = 24
                End With
            End If
        Next shp
        
        ' Add subtle background gradient
        With sld.Background.Fill
            .TwoColorGradient msoGradientHorizontal, 1
            .ForeColor.RGB = RGB(255, 255, 255)    ' White
            .BackColor.RGB = RGB(245, 247, 250)    ' Light Gray
        End With
    Next sld
    
    ' Save presentation
    ppt.SaveAs "NeuroEdu_Presentation.pptx"
End Sub