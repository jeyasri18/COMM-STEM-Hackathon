import React, { useState } from 'react';
import { toast } from 'sonner';
import { api } from '../lib/api';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Checkbox } from '../components/ui/checkbox';
import { Progress } from '../components/ui/progress';
import { Palette, Shirt, Calendar, Ruler } from 'lucide-react';

const STYLES = ["formal", "casual", "vintage", "streetwear", "sport", "festival", "y2k", "minimal", "preppy", "boho"];
const COLORS = ["black", "white", "red", "blue", "green", "yellow", "brown", "beige", "purple", "pink", "navy", "cream", "grey"];
const SEASONS = ["winter", "summer", "spring", "autumn"];
const FITS = ["oversized", "slim", "regular", "relaxed"];
const TYPES = ["dress", "jacket", "coat", "shirt", "top", "jeans", "pants", "skirt", "sneakers", "boots", "hoodie", "suit"];

function StyleQuiz({ user, backendUser }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedStyles, setSelectedStyles] = useState([]);
  const [selectedColors, setSelectedColors] = useState([]);
  const [selectedSeasons, setSelectedSeasons] = useState([]);
  const [selectedFits, setSelectedFits] = useState([]);
  const [avoidTypes, setAvoidTypes] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const steps = [
    { title: "Style Preferences", icon: Shirt },
    { title: "Color Palette", icon: Palette },
    { title: "Seasonal Style", icon: Calendar },
    { title: "Fit Preferences", icon: Ruler },
    { title: "Avoid Types", icon: Shirt }
  ];

  const progress = ((currentStep + 1) / steps.length) * 100;

  const handleStyleToggle = (style) => {
    setSelectedStyles(prev => 
      prev.includes(style) 
        ? prev.filter(s => s !== style)
        : [...prev, style]
    );
  };

  const handleColorToggle = (color) => {
    setSelectedColors(prev => 
      prev.includes(color) 
        ? prev.filter(c => c !== color)
        : [...prev, color]
    );
  };

  const handleSeasonToggle = (season) => {
    setSelectedSeasons(prev => 
      prev.includes(season) 
        ? prev.filter(s => s !== season)
        : [...prev, season]
    );
  };

  const handleFitToggle = (fit) => {
    setSelectedFits(prev => 
      prev.includes(fit) 
        ? prev.filter(f => f !== fit)
        : [...prev, fit]
    );
  };

  const handleAvoidToggle = (type) => {
    setAvoidTypes(prev => 
      prev.includes(type) 
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    if (!backendUser) {
      toast.error('Please sign in to complete the style quiz');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.takeStyleQuiz(backendUser.user_id, {
        user_id: backendUser.user_id,
        preferred_styles: selectedStyles,
        preferred_colors: selectedColors,
        seasons: selectedSeasons,
        preferred_fits: selectedFits,
        avoid_types: avoidTypes
      });
      
      toast.success('Style quiz completed! Your recommendations will be more personalized now.');
    } catch (error) {
      console.error('Failed to submit style quiz:', error);
      toast.error('Failed to save your style preferences. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-4">
            <p className="text-muted-foreground mb-6">
              Select the styles that appeal to you most. You can choose multiple options.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {STYLES.map((style) => (
                <div
                  key={style}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    selectedStyles.includes(style)
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => handleStyleToggle(style)}
                >
                  <div className="text-center">
                    <div className="text-sm font-medium capitalize">{style}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 1:
        return (
          <div className="space-y-4">
            <p className="text-muted-foreground mb-6">
              Choose your favorite colors. These will influence your recommendations.
            </p>
            <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
              {COLORS.map((color) => (
                <div
                  key={color}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    selectedColors.includes(color)
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => handleColorToggle(color)}
                >
                  <div className="text-center">
                    <div 
                      className="w-8 h-8 rounded-full mx-auto mb-2"
                      style={{ backgroundColor: color === 'cream' ? '#f5f5dc' : color }}
                    />
                    <div className="text-sm font-medium capitalize">{color}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <p className="text-muted-foreground mb-6">
              Which seasons do you dress for most often?
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {SEASONS.map((season) => (
                <div
                  key={season}
                  className={`p-6 rounded-lg border-2 cursor-pointer transition-all ${
                    selectedSeasons.includes(season)
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => handleSeasonToggle(season)}
                >
                  <div className="text-center">
                    <div className="text-2xl mb-2">
                      {season === 'winter' && '❄️'}
                      {season === 'spring' && '🌸'}
                      {season === 'summer' && '☀️'}
                      {season === 'autumn' && '🍂'}
                    </div>
                    <div className="text-sm font-medium capitalize">{season}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <p className="text-muted-foreground mb-6">
              What fit styles do you prefer?
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {FITS.map((fit) => (
                <div
                  key={fit}
                  className={`p-6 rounded-lg border-2 cursor-pointer transition-all ${
                    selectedFits.includes(fit)
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => handleFitToggle(fit)}
                >
                  <div className="text-center">
                    <div className="text-sm font-medium capitalize">{fit}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-4">
            <p className="text-muted-foreground mb-6">
              Are there any clothing types you'd prefer to avoid?
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {TYPES.map((type) => (
                <div
                  key={type}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    avoidTypes.includes(type)
                      ? 'border-red-300 bg-red-50 text-red-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => handleAvoidToggle(type)}
                >
                  <div className="text-center">
                    <div className="text-sm font-medium capitalize">{type}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-8">
        <div className="text-center py-12">
          <h1 className="text-2xl text-foreground mb-4">Style Quiz</h1>
          <p className="text-muted-foreground mb-8">
            Please sign in to take the style quiz and get personalized recommendations.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <div className="mb-8">
        <h1 className="text-3xl text-foreground mb-2">Style Quiz</h1>
        <p className="text-muted-foreground">
          Help us understand your style preferences for better recommendations
        </p>
      </div>

      {/* Progress */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-muted-foreground">
            Step {currentStep + 1} of {steps.length}
          </span>
          <span className="text-sm text-muted-foreground">
            {Math.round(progress)}% Complete
          </span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Current Step */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {React.createElement(steps[currentStep].icon, { className: "w-5 h-5" })}
            {steps[currentStep].title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {renderStepContent()}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between mt-8">
        <Button
          variant="outline"
          onClick={handleBack}
          disabled={currentStep === 0}
        >
          Back
        </Button>
        
        <Button
          onClick={handleNext}
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Saving...' : currentStep === steps.length - 1 ? 'Complete Quiz' : 'Next'}
        </Button>
      </div>

      {/* Selected Items Summary */}
      {(selectedStyles.length > 0 || selectedColors.length > 0 || selectedSeasons.length > 0 || selectedFits.length > 0 || avoidTypes.length > 0) && (
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="text-lg">Your Selections</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {selectedStyles.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">Styles</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedStyles.map(style => (
                      <Badge key={style} variant="secondary">{style}</Badge>
                    ))}
                  </div>
                </div>
              )}
              {selectedColors.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">Colors</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedColors.map(color => (
                      <Badge key={color} variant="secondary">{color}</Badge>
                    ))}
                  </div>
                </div>
              )}
              {selectedSeasons.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">Seasons</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedSeasons.map(season => (
                      <Badge key={season} variant="secondary">{season}</Badge>
                    ))}
                  </div>
                </div>
              )}
              {selectedFits.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">Fits</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedFits.map(fit => (
                      <Badge key={fit} variant="secondary">{fit}</Badge>
                    ))}
                  </div>
                </div>
              )}
              {avoidTypes.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">Avoid</h4>
                  <div className="flex flex-wrap gap-2">
                    {avoidTypes.map(type => (
                      <Badge key={type} variant="destructive">{type}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default StyleQuiz;
